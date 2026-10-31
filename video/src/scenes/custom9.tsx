// Chapter 7 scenes (ask before acting): a run frozen mid-air, the step that
// replays from its first line, approvals as a vault's two-person rule, a
// sticky-note overlay on the live sheet, and the world changing while it waits.
// Widths only, never heights; the top-right corner stays free for the term card.
import type { ReactNode } from "react";
import type { Clock } from "../lib/timeline.ts";
import { C, MONO } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, Big, clamp01, during, from } from "./custom3.tsx";

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

const WH = ["Kothrud", "Hadapsar", "Wakad", "Baner", "Kharadi", "Hinjewadi"];

// ------------------------------------------------------------------ the proposed change

export const DiffCard = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      <Abs x={160} y={250} w={760} style={{ ...card(C.blue), padding: "22px 28px", ...rise(f, 4) }}>
        <div style={{ fontSize: 28, fontWeight: 800 }}>🥛 SKU-881 · milk 1 L · safety stock</div>
        {WH.map((w, i) => (
          <div key={w} style={{ display: "flex", fontSize: 28, fontFamily: MONO, padding: "8px 0", borderTop: `1px solid ${C.line}`, marginTop: i ? 0 : 12, ...rise(f, 20 + i * 8, 10) }}>
            <div style={{ flex: 1 }}>{w}</div>
            <div style={{ color: C.muted }}>400</div>
            <div style={{ width: 70, textAlign: "center" }}>→</div>
            <div style={{ color: C.green, fontWeight: 700 }}>480</div>
          </div>
        ))}
      </Abs>
      {t.step >= 1 && (
        <Abs x={1040} y={300} w={760} style={{ ...rise(f, at(t, 1)) }}>
          {[
            ["✋", "stop before writing anything"],
            ["👀", "show Arjun exactly this"],
            ["🌙", "wait: maybe until tomorrow, across a deploy"],
          ].map(([i, s], k) => (
            <div key={s} style={{ ...card(C.amber), padding: "16px 22px", fontSize: 30, fontWeight: 700, marginBottom: 16, ...rise(f, at(t, 1) + k * 20) }}>
              {i} {s}
            </div>
          ))}
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1040} y={660} w={760} style={{ display: "flex", gap: 16, alignItems: "center", ...rise(f, at(t, 2)) }}>
          <Chip color={C.purple} style={{ fontSize: 28 }}>💾 save: chapter 6</Chip>
          <span style={{ fontSize: 34, fontWeight: 800 }}>+</span>
          <Chip color={C.green} style={{ fontSize: 28 }}>⏸ stop on purpose</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ interrupt: the run frozen, just rows in a DB

export const Freeze = ({ t }: CP) => {
  const f = t.frame;
  const st = [
    { x: 220, label: "plan" },
    { x: 760, label: "review" },
    { x: 1300, label: "commit" },
  ];
  const go1 = ease(f, 10, 40);
  const resumed = t.step >= 3 ? ease(f, at(t, 3) + 40, 40) : 0;
  const tx = resumed > 0 ? lerp(910, 1450, resumed) : lerp(370, 910, go1);
  const frozen = t.step >= 1 && resumed === 0;
  return (
    <>
      <Svg>
        <Arrow x1={520} y1={420} x2={750} y2={420} p={ease(f, 4, 14)} />
        <Arrow x1={1060} y1={420} x2={1290} y2={420} p={ease(f, 8, 14)} />
        <circle cx={tx} cy={540} r={18} fill={frozen ? C.cyan : C.blue} />
      </Svg>
      {st.map((s, i) => (
        <Abs key={s.label} x={s.x} y={360} w={300} style={{ ...card(i === 1 && frozen ? C.cyan : i === 2 && resumed > 0.95 ? C.green : C.line), padding: "26px 0", textAlign: "center", fontSize: 36, fontWeight: 800 }}>
          {i === 1 && frozen ? "❄️ " : ""}
          {s.label}
        </Abs>
      ))}
      {t.step >= 1 && (
        <Abs x={640} y={600} w={540} style={{ ...card(C.cyan), padding: "16px 22px", fontFamily: MONO, fontSize: 26, opacity: Math.min(1, pop(f, at(t, 1) + 20)) * (1 - resumed) }}>
          interrupt({"{"} diff {"}"}) → to Arjun's screen
        </Abs>
      )}
      {t.step >= 2 && t.step < 3 && (
        <div style={{ opacity: from(t, 2) }}>
          <Abs x={220} y={720} w={1380} style={{ display: "flex", gap: 30, alignItems: "center", justifyContent: "center" }}>
            {["⚙️ process", "🔌 connection", "🧵 thread"].map((s, i) => (
              <span key={s} style={{ fontSize: 30, color: C.faint, textDecoration: "line-through", opacity: enter(f, at(t, 2) + i * 12) }}>{s}</span>
            ))}
            <span style={{ fontSize: 30 }}>→</span>
            <span style={{ ...card(C.purple), padding: "10px 18px", fontFamily: MONO, fontSize: 26, opacity: enter(f, at(t, 2) + 50) }}>🗄️ just rows in a database</span>
          </Abs>
          <Abs x={1560} y={600} w={200} style={{ fontSize: 80, textAlign: "center", transform: `rotate(${(f - at(t, 2)) * 6}deg)` }}>🕰️</Abs>
        </div>
      )}
      {t.step >= 3 && (
        <Abs x={220} y={720} w={1380} style={{ textAlign: "center", ...rise(f, at(t, 3)) }}>
          <span style={{ ...card(C.green), padding: "12px 22px", fontFamily: MONO, fontSize: 28 }}>Command(resume = approve) · same thread</span>
          <div style={{ fontSize: 30, color: C.muted, marginTop: 26 }}>interrupt() just returns “approve”, like a call that took a day</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the trap: the step replays from line 1

export const Replay = ({ t }: CP) => {
  const f = t.frame;
  const lines = ["diff = build_diff(state)", "db.insert(staged_change, diff)", "decision = interrupt(diff)", "return decision"];
  const run = (col: number, start: number, upto: number, second: boolean) => (
    <Abs x={col} y={300} w={760} style={{ ...card(second ? C.amber : C.blue), padding: "20px 24px", ...rise(f, start) }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: second ? C.amber : C.blue, marginBottom: 10 }}>{second ? "run 2 · after Arjun approves" : "run 1 · before he answers"}</div>
      {lines.map((l, i) => {
        const on = f > start + 16 + i * 18 && i <= upto;
        const again = second && i < 2;
        return (
          <div key={l} style={{ display: "flex", gap: 14, fontFamily: MONO, fontSize: 25, padding: "6px 8px", borderRadius: 8, background: on ? (again ? `${C.red}26` : `${C.green}1a`) : undefined, color: on ? C.text : C.faint }}>
            <span style={{ color: C.faint }}>{i + 1}</span>
            {l}
            {on && i === 2 && <span style={{ color: second ? C.green : C.cyan }}>{second ? " → approve" : " ⏸"}</span>}
            {on && again && <span style={{ color: C.red }}> again!</span>}
          </div>
        );
      })}
    </Abs>
  );
  return (
    <>
      {t.step === 0 && (
        <Abs x={260} y={360} w={1400} style={{ textAlign: "center", opacity: during(t, 0) }}>
          <Big size={52}>a function can't be frozen halfway, and thawed tomorrow on another server.</Big>
          <Big size={52} color={C.amber} style={{ marginTop: 30 }}>so where does it restart?</Big>
        </Abs>
      )}
      {t.step >= 1 && t.step < 3 && (
        <div style={{ opacity: from(t, 1) * (1 - from(t, 3)) }}>
          {run(120, at(t, 1), 2, false)}
          {run(1040, at(t, 1) + 90, 3, true)}
          {t.step >= 2 && (
            <Abs x={120} y={640} w={1680} style={{ textAlign: "center", ...rise(f, at(t, 2)) }}>
              <Big size={44} color={C.red}>two rows in staged_changes, for one proposal</Big>
            </Abs>
          )}
        </div>
      )}
      {t.step >= 3 && (
        <div style={{ opacity: from(t, 3) }}>
          <Abs x={160} y={290} w={760} style={{ ...card(C.green), padding: "20px 24px", fontFamily: MONO, fontSize: 25, lineHeight: 1.6, ...rise(f, at(t, 3)) }}>
            <div style={{ color: C.green, fontWeight: 800, fontFamily: "inherit" }}>step “stage” (finished earlier)</div>
            insert … ON CONFLICT (proposal_id)
            <br />
            &nbsp;&nbsp;DO NOTHING
          </Abs>
          <Abs x={1000} y={290} w={760} style={{ ...card(C.blue), padding: "20px 24px", fontFamily: MONO, fontSize: 25, lineHeight: 1.6, ...rise(f, at(t, 3) + 30) }}>
            <div style={{ color: C.blue, fontWeight: 800 }}>step “review” (only this re-runs)</div>
            return interrupt(diff)
          </Abs>
          {t.step >= 4 && (
            <Abs x={160} y={620} w={1600} style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center", ...rise(f, at(t, 4)) }}>
              <Chip color={C.red} style={{ fontSize: 26 }}>never wrap interrupt() in a bare try/except</Chip>
              <Chip color={C.amber} style={{ fontSize: 26 }}>several interrupts match by order → ask once, with the whole batch</Chip>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ approvals as theatre, then a ladder

export const RubberStamp = ({ t }: CP) => {
  const f = t.frame;
  const stamps = t.step === 0 ? Math.floor(clamp01((f - 30) / 160) * 14) : 14;
  const ladder = [
    ["👀", "only reads", "run automatically", C.green],
    ["🤏", "small, reversible", "run, log it, easy undo", C.blue],
    ["🧑‍💼", "bigger", "Arjun approves", C.amber],
    ["🧑‍💼🧑‍💼", "over 30% or 50+ rows", "Arjun + his manager", C.red],
  ];
  return (
    <>
      {t.step < 2 && (
        <div style={{ opacity: 1 - from(t, 2) }}>
          {Array.from({ length: 14 }, (_, i) => (
            <Abs key={i} x={160 + (i % 7) * 230} y={300 + Math.floor(i / 7) * 190} w={200} style={{ ...card(), padding: "16px 14px", fontSize: 22, color: C.muted, opacity: enter(f, 4 + i * 3) }}>
              {["show stock", "show forecast", "raise 2%", "list SKUs", "show Kothrud", "export CSV", "raise 40%!"][i % 7]}
              {i < stamps && (
                <div style={{ marginTop: 8, color: C.green, fontWeight: 900, fontSize: 24, border: `3px solid ${C.green}`, borderRadius: 6, textAlign: "center", transform: "rotate(-8deg)" }}>APPROVED</div>
              )}
            </Abs>
          ))}
          <Abs x={160} y={720} w={1600} style={{ textAlign: "center", fontFamily: MONO, fontSize: 32, color: C.amber, ...rise(f, 60) }}>2 seconds each · nothing read · “raise 40%!” sailed through</Abs>
          {t.step >= 1 && (
            <Abs x={0} y={800} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 1)) }}>
              <Big size={44}>🏦 a vault's two-person rule works because it's rare</Big>
            </Abs>
          )}
        </div>
      )}
      {t.step >= 2 && (
        <div style={{ opacity: from(t, 2) }}>
          {ladder.map(([icon, what, then, col], i) => (
            <Abs key={what} x={260 + i * 60} y={270 + i * 130} w={1100} style={{ ...card(col), padding: "16px 24px", display: "flex", alignItems: "center", gap: 22, opacity: Math.min(1, pop(f, at(t, 2) + i * 16)) }}>
              <span style={{ fontSize: 44 }}>{icon}</span>
              <span style={{ fontSize: 32, fontWeight: 800, flex: 1 }}>{what}</span>
              <span style={{ fontSize: 28, color: col }}>{then}</span>
            </Abs>
          ))}
          {t.step >= 3 && (
            <Abs x={260} y={820} w={1400} style={{ ...rise(f, at(t, 3)) }}>
              <Chip color={C.purple} style={{ fontSize: 28 }}>thresholds live in code, not in the prompt</Chip>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ approve the exact change: the review card

export const ReviewCard = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      {t.step === 0 && (
        <div style={{ opacity: during(t, 0) }}>
          <Abs x={160} y={320} w={620} style={{ ...card(C.amber), padding: "22px 28px", fontSize: 32, fontWeight: 700, ...rise(f, 4) }}>
            ✅ approved: “raise milk safety stock 20%”
          </Abs>
          <Svg>
            <Arrow x1={800} y1={380} x2={980} y2={380} p={ease(f, 40, 14)} />
          </Svg>
          <Abs x={1000} y={300} w={760} style={{ ...card(C.red), padding: "22px 28px", ...rise(f, 60) }}>
            <div style={{ fontSize: 26, color: C.muted }}>built after approval…</div>
            <div style={{ fontFamily: MONO, fontSize: 28, marginTop: 8 }}>UPDATE … WHERE state = 'Maharashtra'</div>
            <div style={{ fontSize: 28, color: C.red, marginTop: 8, fontWeight: 700 }}>not Pune. All of it.</div>
          </Abs>
        </div>
      )}
      {t.step >= 1 && (
        <div style={{ opacity: from(t, 1) }}>
          <Abs x={360} y={260} w={1200} style={{ ...card(C.blue), padding: "24px 30px", ...rise(f, at(t, 1)) }}>
            <div style={{ fontSize: 26, color: C.muted }}>Arjun's review card</div>
            <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>SKU-881 milk 1 L · 6 Pune warehouses · 400 → 480 · +480 units</div>
            <div style={{ fontSize: 26, color: C.muted, marginTop: 12, ...rise(f, at(t, 1) + 30) }}>why: your request · forecast +18% for Diwali week</div>
            <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap", ...rise(f, at(t, 1) + 50) }}>
              <Chip color={C.amber} style={{ fontSize: 24 }}>⚠ +20% is above the usual 10%</Chip>
              <Chip color={C.amber} style={{ fontSize: 24 }}>⚠ forecast data is 3 days old</Chip>
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: 22, ...rise(f, at(t, 1) + 70) }}>
              {[
                ["approve", C.green],
                ["edit", C.blue],
                ["reject + reason", C.red],
              ].map(([s, col]) => (
                <div key={s} style={{ padding: "12px 26px", borderRadius: 12, background: `${col}22`, border: `2px solid ${col}`, color: col, fontWeight: 800, fontSize: 28 }}>
                  {s}
                </div>
              ))}
            </div>
          </Abs>
          {t.step >= 2 && (
            <Abs x={360} y={760} w={1200} style={{ textAlign: "center", ...rise(f, at(t, 2)) }}>
              <Chip color={C.purple} style={{ fontSize: 28 }}>100% approved in 3 seconds each? the gate adds nothing</Chip>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ base and overlay: a sticky note on the live sheet

export const Overlay = ({ t }: CP) => {
  const f = t.frame;
  const noteIn = t.step >= 1 ? ease(f, at(t, 1) + 10, 24) : 0;
  const commit = t.step >= 2 ? ease(f, at(t, 2) + 30, 20) : 0;
  const peel = t.step >= 3 ? ease(f, at(t, 3) + 10, 30) : 0;
  const committed = commit > 0.5 && t.step < 3;
  return (
    <>
      <Abs x={160} y={260} w={700} style={{ ...card(C.line), padding: "20px 26px", ...rise(f, 4) }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.muted }}>🗄️ base table · what ordering reads</div>
        {WH.map((w) => (
          <div key={w} style={{ display: "flex", fontFamily: MONO, fontSize: 28, padding: "8px 0", borderTop: `1px solid ${C.line}` }}>
            <div style={{ flex: 1 }}>{w}</div>
            <div style={{ color: committed ? C.green : C.text, fontWeight: 700 }}>{committed ? 480 : 400}</div>
          </div>
        ))}
      </Abs>
      <Abs x={1040} y={400} w={240} style={{ textAlign: "center", fontSize: 90, ...rise(f, 20) }}>🚚</Abs>
      <Abs x={940} y={540} w={440} style={{ textAlign: "center", fontSize: 26, color: C.muted, ...rise(f, 30) }}>ordering systems see {committed ? 480 : 400}</Abs>
      {t.step >= 1 && (
        <Abs
          x={lerp(1500, 600, noteIn) + peel * 120}
          y={lerp(260, 340, noteIn) + peel * 80}
          w={330}
          style={{ background: "#ffe58a", color: "#3a3000", borderRadius: 8, padding: "18px 20px", boxShadow: "0 14px 40px rgba(0,0,0,.45)", transform: `rotate(${3 - peel * 40}deg) scale(${1 - commit * 0.25 * (t.step < 3 ? 1 : 0)})`, opacity: (t.step >= 2 && t.step < 3 ? 1 - commit : 1) * (1 - peel) }}
        >
          <div style={{ fontSize: 24, fontWeight: 900 }}>📝 overlay p-77</div>
          <div style={{ fontFamily: MONO, fontSize: 26, marginTop: 8 }}>6 rows: 400 → 480</div>
        </Abs>
      )}
      {t.step >= 2 && t.step < 3 && (
        <Abs x={940} y={660} w={860} style={{ ...card(C.green), padding: "18px 24px", fontSize: 30, fontWeight: 700, ...rise(f, at(t, 2) + 40) }}>
          ✅ approve → applied in one transaction: all six rows, or none
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={940} y={660} w={860} style={{ ...card(C.red), padding: "18px 24px", fontSize: 30, fontWeight: 700, ...rise(f, at(t, 3) + 20) }}>
          ✖ reject or expire → the note is removed; the reason goes back to the agent
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ what goes wrong while it waits

export const Stale = ({ t }: CP) => {
  const f = t.frame;
  const v = t.step >= 1 && f > at(t, 1) + 50 ? 8 : 7;
  const cards = [
    { step: 2, icon: "🏖️", head: "Arjun is on leave", fix: "expire in 72 h · remind · escalate" },
    { step: 3, icon: "⚔️", head: "two planners, conflicting changes", fix: "one open proposal per item · commit keyed by proposal id" },
    { step: 4, icon: "🚀", head: "a deploy while 200 runs wait", fix: "backward-compatible changes, or drain first" },
  ];
  return (
    <>
      {t.step === 0 && (
        <Abs x={260} y={380} w={1400} style={{ textAlign: "center", opacity: during(t, 0) }}>
          <Big size={52}>60 planners. what can go wrong between the proposal and the commit?</Big>
        </Abs>
      )}
      {t.step >= 1 && (
        <div style={{ opacity: from(t, 1) }}>
          <Abs x={120} y={270} w={820} style={{ ...card(C.blue), padding: "20px 26px", ...rise(f, at(t, 1)) }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>Kothrud · milk</div>
            <div style={{ fontFamily: MONO, fontSize: 26, color: C.muted, marginTop: 8 }}>Arjun's proposal saw version 7</div>
            <div style={{ fontFamily: MONO, fontSize: 26, marginTop: 6, color: v === 8 ? C.amber : C.muted }}>
              {v === 8 ? "an hour later, another planner → version 8" : "…"}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 24, marginTop: 14, padding: "10px 14px", borderRadius: 8, background: C.bg2, opacity: enter(f, at(t, 1) + 90) }}>
              UPDATE … SET qty = 480
              <br />
              WHERE id = 'kothrud-881' AND version = 7
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.red, marginTop: 12, opacity: enter(f, at(t, 1) + 130) }}>0 rows updated → abort, re-propose on fresh data</div>
          </Abs>
          <Abs x={1000} y={380} w={800}>
            {cards.map((c) =>
              t.step >= c.step ? (
                <div key={c.head} style={{ ...card(C.amber), padding: "16px 22px", marginBottom: 18, ...rise(f, at(t, c.step)) }}>
                  <div style={{ fontSize: 30, fontWeight: 800 }}>
                    {c.icon} {c.head}
                  </div>
                  <div style={{ fontSize: 25, color: C.green, marginTop: 6 }}>→ {c.fix}</div>
                </div>
              ) : null,
            )}
          </Abs>
        </div>
      )}
    </>
  );
};

