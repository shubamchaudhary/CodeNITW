// Chapter 6 scenes (agents that remember): save points, a lift button, a desk
// that fills up, a notebook about people, fan-out lanes and a team of agents.
// Widths only, never heights; the top-right corner stays free for the term card.
import type { ReactNode } from "react";
import type { Clock } from "../lib/timeline.ts";
import { C, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, Big, clamp01, during, from, rnd } from "./custom3.tsx";

type CP = { t: Clock; props?: Record<string, unknown> };

const Svg = ({ children }: { children: ReactNode }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

const Arrow = ({ x1, y1, x2, y2, color = C.muted, p = 1, dash }: { x1: number; y1: number; x2: number; y2: number; color?: string; p?: number; dash?: boolean }) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g>
      <line x1={x1} y1={y1} x2={lerp(x1, x2, p)} y2={lerp(y1, y2, p)} stroke={color} strokeWidth={4} strokeDasharray={dash ? "10 10" : undefined} strokeLinecap="round" />
      {p > 0.95 && <polygon points={`${x2},${y2} ${x2 - 18 * Math.cos(a - 0.42)},${y2 - 18 * Math.sin(a - 0.42)} ${x2 - 18 * Math.cos(a + 0.42)},${y2 - 18 * Math.sin(a + 0.42)}`} fill={color} />}
    </g>
  );
};

// ------------------------------------------------------------------ save the game

export const SaveGame = ({ t }: CP) => {
  const f = t.frame;
  const steps = [
    { x: 260, label: "classify" },
    { x: 760, label: "retrieve" },
    { x: 1260, label: "answer" },
  ];
  const crashed = t.step >= 3;
  const reload = t.step >= 3 ? ease(f, at(t, 3) + 60, 30) : 0;
  return (
    <>
      {t.step === 0 && (
        <div style={{ opacity: during(t, 0) }}>
          <Abs x={0} y={290} w={1920} style={{ textAlign: "center", fontSize: 150, ...rise(f, 4) }}>🎮</Abs>
          <Abs x={0} y={520} w={1920} style={{ textAlign: "center", ...rise(f, 30) }}>
            <Big size={50}>lose a level? load the last save.</Big>
          </Abs>
        </div>
      )}
      {t.step >= 1 && (
        <div style={{ opacity: from(t, 1) }}>
          <Svg>
            {steps.slice(0, 2).map((s, i) => (
              <Arrow key={i} x1={s.x + 320} y1={500} x2={steps[i + 1].x - 10} y2={500} p={ease(f, at(t, 1) + 10 + i * 10, 14)} />
            ))}
          </Svg>
          {steps.map((s, i) => {
            const bad = crashed && i === 2 && reload < 0.5;
            return (
              <Abs key={s.label} x={s.x} y={440} w={320} style={{ ...card(bad ? C.red : i < 2 || (crashed && reload > 0.5) ? C.green : C.line), padding: "26px 0", textAlign: "center", fontSize: 36, fontWeight: 800, ...rise(f, at(t, 1) + i * 10) }}>
                {bad ? "💥 " : ""}
                {s.label}
              </Abs>
            );
          })}
          {steps.slice(0, 2).map((s, i) => (
            <Abs key={i} x={s.x + 110} y={620} w={100} style={{ textAlign: "center", fontSize: 64, opacity: Math.min(1, pop(f, at(t, 1) + 40 + i * 20)) }}>
              💾
            </Abs>
          ))}
          {t.step >= 2 && (
            <Abs x={120} y={260} w={1200} style={{ display: "flex", gap: 20, alignItems: "center", ...rise(f, at(t, 2)) }}>
              <Chip color={C.purple} style={{ fontSize: 30, fontFamily: MONO }}>thread_id = agent7-FC20931</Chip>
              {t.step === 2 && <span style={{ fontSize: 28, color: C.muted, opacity: enter(f, at(t, 2) + 60) }}>10:20 “and was the bread delivered?” → knows the order ✓</span>}
            </Abs>
          )}
          {crashed && (
            <>
              <Svg>
                <Arrow x1={920} y1={720} x2={1340} y2={600} p={reload} color={C.green} dash />
              </Svg>
              <Abs x={260} y={770} w={1400} style={{ fontSize: 32, fontWeight: 700, ...rise(f, at(t, 3) + 50) }}>
                restart → load the save after <span style={{ color: C.green }}>retrieve</span> → run <span style={{ color: C.amber }}>answer</span> again, from its first line
              </Abs>
            </>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ idempotency: the lift button

export const LiftButton = ({ t }: CP) => {
  const f = t.frame;
  const presses = t.step >= 1 ? Math.min(5, Math.floor((f - at(t, 1)) / 14)) : 0;
  const ledger = (twice: boolean, start: number) => (
    <Abs x={1100} y={300} w={680} style={{ ...card(twice ? C.red : C.green), padding: "22px 28px", ...rise(f, start) }}>
      <div style={{ fontSize: 28, fontWeight: 800 }}>💳 customer's credits</div>
      {[0, 1].map((i) =>
        i === 1 && !twice ? (
          <div key={i} style={{ fontFamily: MONO, fontSize: 26, color: C.muted, marginTop: 12 }}>retry: key already seen → ignored</div>
        ) : (
          <div key={i} style={{ fontFamily: MONO, fontSize: 30, marginTop: 12, color: twice ? C.red : C.text }}>
            + ₹150 · FC-20931
          </div>
        ),
      )}
    </Abs>
  );
  return (
    <>
      {t.step === 0 && (
        <div style={{ opacity: during(t, 0) }}>
          {ledger(true, 4)}
          <Abs x={140} y={330} w={860} style={{ ...rise(f, 30) }}>
            <Big size={46}>the interrupted step ran again, from its first line</Big>
          </Abs>
        </div>
      )}
      {t.step >= 1 && (
        <div style={{ opacity: from(t, 1) }}>
          <Svg>
            <circle cx={420} cy={480} r={110} fill={presses % 2 ? C.amber : C.card2} stroke={C.amber} strokeWidth={6} />
            <polygon points="420,430 470,510 370,510" fill={C.text} />
          </Svg>
          <Abs x={220} y={630} w={400} style={{ textAlign: "center", fontFamily: MONO, fontSize: 32, color: C.amber }}>pressed × {presses}</Abs>
          <Abs x={700} y={420} w={200} style={{ textAlign: "center", fontSize: 110, opacity: enter(f, at(t, 1) + 70) }}>🛗</Abs>
          <Abs x={640} y={580} w={320} style={{ textAlign: "center", fontSize: 30, fontWeight: 800, color: C.green, opacity: enter(f, at(t, 1) + 80) }}>arrives once</Abs>
          {t.step >= 2 && (
            <>
              {ledger(false, at(t, 2) + 40)}
              <Abs x={1100} y={560} w={680} style={{ ...card(C.blue), padding: "18px 24px", fontFamily: MONO, fontSize: 24, lineHeight: 1.5, ...rise(f, at(t, 2)) }}>
                credit(FC-20931, 150,
                <br />
                &nbsp;&nbsp;key=<span style={{ color: C.amber }}>"credit:FC-20931:late"</span>)
              </Abs>
            </>
          )}
          {t.step >= 3 && (
            <Abs x={140} y={800} w={1640} style={{ textAlign: "center", ...rise(f, at(t, 3)) }}>
              <Chip color={C.purple} style={{ fontSize: 28 }}>checkpoints make runs resumable, not exactly-once</Chip>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the context window as a desk

export const Desk = ({ t }: CP) => {
  const f = t.frame;
  const n = 18;
  const trim = t.step >= 2 ? ease(f, at(t, 2) + 10, 30) : 0;
  const squeeze = t.step >= 3 ? ease(f, at(t, 3) + 10, 30) : 0;
  const pin = t.step >= 3 ? ease(f, at(t, 3) + 60, 20) : 0;
  return (
    <>
      <Abs x={200} y={300} w={1060} style={{ height: 0 }}>
        <svg width={1060} height={540} style={{ position: "absolute", left: 0, top: 0 }}>
          <rect x={0} y={0} width={1060} height={540} rx={24} fill="#3a2a1d" opacity={0.55} />
        </svg>
      </Abs>
      <Abs x={210} y={262} w={400} style={{ fontSize: 26, color: C.muted, fontWeight: 700, ...rise(f, 4) }}>the context window</Abs>
      {Array.from({ length: n }, (_, i) => {
        const old = i < 10;
        const show = enter(f, 6 + i * 4);
        const gone = old ? Math.max(i < 5 ? trim : 0, squeeze) : 0;
        const x = 240 + (i % 6) * 165 + rnd(i) * 20;
        const y = 340 + Math.floor(i / 6) * 150 + rnd(i + 3) * 20;
        return (
          <Abs key={i} x={lerp(x, 330, squeeze * (old ? 1 : 0))} y={lerp(y, 380, squeeze * (old ? 1 : 0))} w={140} style={{ background: i === 0 ? "#ffe58a" : "#e9edf4", color: "#333", borderRadius: 6, padding: "10px 12px", fontSize: 20, fontFamily: MONO, opacity: show * (1 - gone), transform: `rotate(${(rnd(i + 7) - 0.5) * 12}deg)` }}>
            {i === 0 ? "FC-20931" : `msg ${i + 1}`}
          </Abs>
        );
      })}
      {t.step === 0 && (
        <Abs x={1340} y={330} w={460} style={{ ...rise(f, 50) }}>
          <div style={{ fontFamily: MONO, fontSize: 44, fontWeight: 800, color: C.red }}>40,000 tokens</div>
          <div style={{ fontSize: 30, color: C.muted, marginTop: 10 }}>after 60 messages: slower, pricier, and the order number is buried</div>
        </Abs>
      )}
      {squeeze > 0 && (
        <Abs x={240} y={350} w={300} style={{ ...card(C.purple), padding: "14px 18px", fontSize: 24, fontWeight: 700, opacity: squeeze }}>
          📝 summary of the older messages
        </Abs>
      )}
      {pin > 0 && (
        <Abs x={lerp(260, 1340, pin)} y={lerp(340, 640, pin)} w={380} style={{ background: "#ffe58a", color: "#3a3000", borderRadius: 8, padding: "14px 18px", fontSize: 26, fontWeight: 800, fontFamily: MONO, boxShadow: "0 10px 30px rgba(0,0,0,.4)" }}>
          📌 order_id: FC-20931
        </Abs>
      )}
      {t.step >= 1 && (
        <Abs x={1340} y={330} w={460} style={{ display: "flex", flexDirection: "column", gap: 16, opacity: from(t, 1) }}>
          {[
            ["✂️ keep the recent messages", 2],
            ["🗜️ summarise the older ones", 3],
            ["📌 pin facts in their own fields", 3],
          ].map(([s, st]) =>
            t.step >= (st as number) ? (
              <div key={s as string} style={{ ...card(C.green), padding: "14px 20px", fontSize: 28, fontWeight: 700, ...rise(f, at(t, st as number)) }}>
                {s as string}
              </div>
            ) : null,
          )}
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={200} y={870} w={1600} style={{ display: "flex", gap: 20, ...rise(f, at(t, 4)) }}>
          <Chip color={C.amber} style={{ fontSize: 26 }}>old tool outputs: shrink them first</Chip>
          <Chip color={C.blue} style={{ fontSize: 26 }}>fixed parts first, question last</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ long-term memory: a notebook about people

export const Notebook = ({ t }: CP) => {
  const f = t.frame;
  const flowIn = t.step >= 1 ? ease(f, at(t, 1) + 30, 40) : 0;
  const flowOut = t.step >= 1 ? ease(f, at(t, 1) + 110, 40) : 0;
  return (
    <>
      {t.step === 0 && (
        <div style={{ opacity: during(t, 0) }}>
          {["Mon", "Tue", "Wed"].map((d, i) => (
            <Abs key={d} x={260 + i * 480} y={330} w={400} style={{ ...card(), padding: "22px 26px", ...rise(f, 6 + i * 16) }}>
              <div style={{ fontSize: 26, color: C.muted }}>{d} · new chat</div>
              <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>“Which city do you handle?”</div>
            </Abs>
          ))}
          <Abs x={0} y={600} w={1920} style={{ textAlign: "center", ...rise(f, 70) }}>
            <Big size={46} color={C.amber}>every new conversation starts from zero</Big>
          </Abs>
        </div>
      )}
      {t.step >= 1 && (
        <div style={{ opacity: from(t, 1) }}>
          <Abs x={120} y={330} w={380} style={{ ...card(C.blue), padding: "22px 24px", textAlign: "center", fontSize: 30, fontWeight: 800 }}>
            💬 conversation ends
          </Abs>
          <Abs x={760} y={290} w={420} style={{ background: "#f4efe2", color: "#2a2a2a", borderRadius: 12, padding: "24px 28px", boxShadow: "0 18px 50px rgba(0,0,0,.4)" }}>
            <div style={{ fontSize: 28, fontWeight: 900 }}>📓 agents / agent7</div>
            <div style={{ fontSize: 26, marginTop: 12, opacity: flowIn }}>• handles Pune only</div>
            <div style={{ fontSize: 26, marginTop: 6, opacity: flowIn }}>• prefers short answers</div>
          </Abs>
          <Abs x={1420} y={330} w={380} style={{ ...card(C.green), padding: "22px 24px", textAlign: "center", fontSize: 30, fontWeight: 800, opacity: enter(f, at(t, 1) + 100) }}>
            💬 new conversation
            <div style={{ fontSize: 24, color: C.green, marginTop: 6, fontWeight: 600, opacity: flowOut }}>knows: Pune only ✓</div>
          </Abs>
          <Svg>
            <Arrow x1={510} y1={380} x2={750} y2={380} p={flowIn} color={C.blue} />
            <Arrow x1={1190} y1={380} x2={1410} y2={380} p={flowOut} color={C.green} />
          </Svg>
          <Abs x={510} y={420} w={240} style={{ textAlign: "center", fontSize: 22, color: C.muted, opacity: flowIn }}>extract facts</Abs>
          <Abs x={1190} y={420} w={220} style={{ textAlign: "center", fontSize: 22, color: C.muted, opacity: flowOut }}>search, take a few</Abs>
          {t.step >= 2 && (
            <Abs x={120} y={580} w={1680} style={{ display: "flex", gap: 24, justifyContent: "center", ...rise(f, at(t, 2)) }}>
              {[
                ["facts", "agent7 handles Pune"],
                ["experiences", "last cold-chain answer: runbook 17"],
                ["how to behave", "refined instructions"],
              ].map(([k, v], i) => (
                <div key={k} style={{ ...card(PALETTE[i]), padding: "16px 22px", opacity: enter(f, at(t, 2) + i * 16) }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: PALETTE[i] }}>{k}</div>
                  <div style={{ fontSize: 24, color: C.muted, marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </Abs>
          )}
          {t.step >= 3 && (
            <Abs x={120} y={790} w={1680} style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", ...rise(f, at(t, 3)) }}>
              {["stale → timestamps, newer wins", "personal → users can see and delete", "poisoned → treat writes as untrusted", "bloat → a few, never all"].map((s) => (
                <Chip key={s} color={C.amber} style={{ fontSize: 24 }}>{s}</Chip>
              ))}
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ fan-out: 500 emails in lanes

export const FanOut = ({ t }: CP) => {
  const f = t.frame;
  const lanes = 10;
  const serial = t.step === 0 ? clamp01((f - 20) / 200) : 0;
  const par = t.step >= 1 ? f - at(t, 1) - 30 : 0;
  const done = (i: number) => clamp01((par - rnd(i) * 30) / (70 + rnd(i + 4) * 50));
  const all = t.step >= 1 && Array.from({ length: lanes }, (_, i) => done(i)).every((d) => d >= 1);
  return (
    <>
      <Abs x={110} y={300} w={220} style={{ ...card(C.blue), padding: "22px 0", textAlign: "center", ...rise(f, 4) }}>
        <div style={{ fontSize: 60 }}>✉️</div>
        <div style={{ fontSize: 30, fontWeight: 800 }}>500 emails</div>
      </Abs>
      {t.step === 0 && (
        <div style={{ opacity: during(t, 0) }}>
          <Abs x={420} y={360} w={1200}>
            <div style={{ height: 30, borderRadius: 15, background: C.card2 }}>
              <div style={{ height: 30, borderRadius: 15, width: `${serial * 18}%`, background: C.amber }} />
            </div>
            <div style={{ fontSize: 30, color: C.muted, marginTop: 16, fontFamily: MONO }}>one by one: {Math.round(serial * 90)} of 500 · about an hour</div>
          </Abs>
        </div>
      )}
      {t.step >= 1 && (
        <div style={{ opacity: from(t, 1) }}>
          <Svg>
            {Array.from({ length: lanes }, (_, i) => (
              <g key={i}>
                <line x1={340} y1={360} x2={480} y2={300 + i * 52 + 12} stroke={C.line} strokeWidth={3} />
                <line x1={1200} y1={300 + i * 52 + 12} x2={1330} y2={560} stroke={done(i) >= 1 ? C.green : C.line} strokeWidth={3} />
              </g>
            ))}
          </Svg>
          {Array.from({ length: lanes }, (_, i) => (
            <Abs key={i} x={490} y={300 + i * 52} w={700}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 160, fontFamily: MONO, fontSize: 20, color: C.muted }}>{i === lanes - 1 ? "… email 500" : `email ${i + 1}`}</div>
                <div style={{ flex: 1, height: 22, borderRadius: 11, background: C.card2 }}>
                  <div style={{ height: 22, borderRadius: 11, width: `${done(i) * 100}%`, background: PALETTE[i % PALETTE.length] }} />
                </div>
              </div>
            </Abs>
          ))}
          <Abs x={1340} y={510} w={200} style={{ ...card(all ? C.green : C.line), padding: "18px 0", textAlign: "center", fontSize: 28, fontWeight: 800 }}>combine</Abs>
          <Abs x={1580} y={490} w={240} style={{ ...card(C.green), padding: "14px 0", textAlign: "center", opacity: all ? enter(f, at(t, 1) + 200) : 0 }}>
            <div style={{ fontSize: 50 }}>📊</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>weekly report</div>
          </Abs>
          {t.step >= 2 && (
            <Abs x={420} y={850} w={1400} style={{ display: "flex", gap: 20, ...rise(f, at(t, 2)) }}>
              <Chip color={C.amber} style={{ fontSize: 26 }}>max_concurrency below the rate limit</Chip>
              <Chip color={C.purple} style={{ fontSize: 26 }}>retry with backoff</Chip>
              {t.step >= 3 && <Chip color={C.green} style={{ fontSize: 26, ...rise(f, at(t, 3)) }}>finished lanes survive a crash</Chip>}
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ subgraphs and streaming

export const Reuse = ({ t }: CP) => {
  const f = t.frame;
  const flows = ["support", "planning", "weekly report"];
  const lines = ["Classified: late delivery", "Found 5 policy passages", "Summarised 120 of 500 emails", "Writing the answer…"];
  return (
    <>
      {t.step < 2 && (
        <div style={{ opacity: 1 - from(t, 2) }}>
          <Abs x={760} y={300} w={400} style={{ ...card(C.purple), padding: "20px 24px", textAlign: "center", ...rise(f, 4) }}>
            <div style={{ fontSize: 30, fontWeight: 800 }}>🧩 policy lookup</div>
            <div style={{ fontSize: 24, color: C.muted, marginTop: 6 }}>retrieve → grade → rewrite</div>
          </Abs>
          {t.step >= 1 && (
            <>
              <Svg>
                {flows.map((_, i) => (
                  <Arrow key={i} x1={960} y1={400} x2={360 + i * 600} y2={560} p={ease(f, at(t, 1) + 10 + i * 10, 16)} color={C.purple} />
                ))}
              </Svg>
              {flows.map((w, i) => (
                <Abs key={w} x={200 + i * 600} y={580} w={320} style={{ ...card(C.line), padding: "18px 20px", textAlign: "center", opacity: Math.min(1, pop(f, at(t, 1) + 26 + i * 10)) }}>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{w}</div>
                  <div style={{ display: "inline-block", marginTop: 10, ...card(C.purple), padding: "6px 14px", fontSize: 22 }}>🧩 policy lookup</div>
                </Abs>
              ))}
            </>
          )}
        </div>
      )}
      {t.step >= 2 && (
        <div style={{ opacity: from(t, 2) }}>
          <Abs x={460} y={290} w={1000} style={{ ...card(C.blue), padding: "26px 30px" }}>
            <div style={{ fontSize: 26, color: C.muted, marginBottom: 10 }}>what the person sees, live</div>
            {lines.map((l, i) => (
              <div key={l} style={{ fontSize: 32, fontWeight: 600, padding: "8px 0", opacity: enter(f, at(t, 2) + 20 + i * 30), color: i === lines.length - 1 ? C.blue : C.text }}>
                {i === lines.length - 1 ? "⏳" : "✓"} {l}
              </div>
            ))}
          </Abs>
          {t.step >= 3 && (
            <Abs x={460} y={720} w={1000} style={{ textAlign: "center", ...rise(f, at(t, 3)) }}>
              <Big size={40} color={C.green}>a slow answer feels fast when you can watch it work</Big>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ one agent or a team?

export const Team = ({ t }: CP) => {
  const f = t.frame;
  const pat = [
    { name: "supervisor", note: "a manager sees every turn" },
    { name: "handoffs", note: "pass control directly" },
    { name: "agent as tool", note: "specialists return summaries" },
  ];
  const x0 = (i: number) => 140 + i * 570;
  return (
    <>
      {t.step === 0 && (
        <div style={{ opacity: during(t, 0) }}>
          {[
            ["🧑‍💼", "manager"],
            ["🎧", "support"],
            ["💸", "refunds"],
            ["🚚", "logistics"],
          ].map(([icon, n], i) => (
            <Abs key={n} x={300 + i * 340} y={360} w={280} style={{ ...card(PALETTE[i]), padding: "22px 0", textAlign: "center", opacity: Math.min(1, pop(f, 10 + i * 12)) }}>
              <div style={{ fontSize: 70 }}>{icon}</div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>{n} agent</div>
            </Abs>
          ))}
          <Abs x={0} y={650} w={1920} style={{ textAlign: "center", ...rise(f, 70) }}>
            <Big size={46}>“a team of agents” · sounds powerful</Big>
          </Abs>
        </div>
      )}
      {t.step >= 1 && t.step < 4 && (
        <div style={{ opacity: from(t, 1) * (1 - from(t, 4)) }}>
          {pat.map((p, i) =>
            t.step >= i + 1 ? (
              <Abs key={p.name} x={x0(i)} y={300} w={510} style={{ ...card(t.step === i + 1 ? PALETTE[i] : C.line), padding: "22px 24px", ...rise(f, at(t, i + 1)) }}>
                <div style={{ fontSize: 34, fontWeight: 800 }}>{p.name}</div>
                <div style={{ fontSize: 26, color: C.muted, marginTop: 4 }}>{p.note}</div>
                <svg width={460} height={220} style={{ marginTop: 14 }}>
                  {i === 0 && (
                    <>
                      {[80, 230, 380].map((x) => (
                        <line key={x} x1={230} y1={50} x2={x} y2={170} stroke={C.muted} strokeWidth={3} />
                      ))}
                      <circle cx={230} cy={50} r={34} fill={PALETTE[0]} />
                      {[80, 230, 380].map((x) => (
                        <circle key={x} cx={x} cy={170} r={28} fill={C.card2} stroke={C.muted} strokeWidth={3} />
                      ))}
                    </>
                  )}
                  {i === 1 && (
                    <>
                      <line x1={70} y1={110} x2={390} y2={110} stroke={C.muted} strokeWidth={3} />
                      {[70, 230, 390].map((x, k) => (
                        <circle key={x} cx={x} cy={110} r={30} fill={k === Math.floor(((f - at(t, 2)) / 40) % 3) ? PALETTE[1] : C.card2} stroke={C.muted} strokeWidth={3} />
                      ))}
                    </>
                  )}
                  {i === 2 && (
                    <>
                      <rect x={150} y={20} width={160} height={70} rx={14} fill={PALETTE[2]} />
                      {[110, 350].map((x) => (
                        <g key={x}>
                          <line x1={230} y1={90} x2={x} y2={160} stroke={C.muted} strokeWidth={3} />
                          <rect x={x - 50} y={150} width={100} height={50} rx={10} fill={C.card2} stroke={C.muted} strokeWidth={3} />
                        </g>
                      ))}
                    </>
                  )}
                </svg>
              </Abs>
            ) : null,
          )}
        </div>
      )}
      {t.step >= 4 && (
        <div style={{ opacity: from(t, 4) }}>
          <Abs x={200} y={300} w={640} style={{ ...card(C.pink), padding: "24px 28px", ...rise(f, at(t, 4)) }}>
            <div style={{ fontSize: 28, color: C.muted }}>💸 refunds agent decided</div>
            <div style={{ fontSize: 40, fontWeight: 800, marginTop: 6 }}>“refund the milk”</div>
          </Abs>
          <Abs x={1080} y={300} w={640} style={{ ...card(C.cyan), padding: "24px 28px", ...rise(f, at(t, 4) + 20) }}>
            <div style={{ fontSize: 28, color: C.muted }}>🚚 logistics agent decided</div>
            <div style={{ fontSize: 40, fontWeight: 800, marginTop: 6 }}>“send a fresh pack”</div>
          </Abs>
          <Abs x={0} y={520} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 4) + 50) }}>
            <Big size={44} color={C.red}>neither saw the other's decision</Big>
          </Abs>
          {t.step >= 5 && (
            <Abs x={360} y={680} w={1200} style={{ display: "flex", gap: 30, justifyContent: "center", ...rise(f, at(t, 5)) }}>
              {[
                ["1×", "a chat"],
                ["4×", "one agent"],
                ["15×", "many agents"],
              ].map(([k, v], i) => (
                <div key={v} style={{ ...card(i === 2 ? C.amber : C.line), padding: "16px 30px", textAlign: "center", opacity: enter(f, at(t, 5) + i * 16) }}>
                  <div style={{ fontFamily: MONO, fontSize: 50, fontWeight: 800, color: i === 2 ? C.amber : C.text }}>{k}</div>
                  <div style={{ fontSize: 26, color: C.muted }}>tokens · {v}</div>
                </div>
              ))}
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the handover note

export const Handover = ({ t }: CP) => {
  const f = t.frame;
  const squeeze = ease(f, 40, 40);
  return (
    <>
      <Abs x={120} y={290} w={520}>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} style={{ ...card(), padding: "8px 16px", fontSize: 20, color: C.faint, marginBottom: 8, opacity: enter(f, 4 + i * 3) * (1 - squeeze * 0.6), transform: `translateX(${squeeze * 40}px)` }}>
            message {i * 3 + 1} · back-and-forth…
          </div>
        ))}
        <div style={{ fontSize: 24, color: C.muted, marginTop: 6 }}>support agent · 25 messages</div>
      </Abs>
      <Svg>
        <Arrow x1={660} y1={480} x2={760} y2={480} p={ease(f, 50, 14)} color={C.amber} />
        <Arrow x1={1260} y1={480} x2={1360} y2={480} p={ease(f, 90, 14)} color={C.green} />
      </Svg>
      <Abs x={780} y={330} w={460} style={{ background: "#ffe58a", color: "#3a3000", borderRadius: 10, padding: "22px 26px", fontSize: 26, fontWeight: 700, lineHeight: 1.45, opacity: Math.min(1, pop(f, 60)), transform: "rotate(-1.5deg)" }}>
        📝 handover note
        <div style={{ fontWeight: 500 }}>order FC-20931 · milk spoiled on day 1 · photo received · wants a refund</div>
      </Abs>
      <Abs x={1380} y={380} w={400} style={{ ...card(C.pink), padding: "22px 24px", textAlign: "center", ...rise(f, 100) }}>
        <div style={{ fontSize: 60 }}>💸</div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>refunds agent</div>
        <div style={{ fontSize: 22, color: C.muted }}>starts from the note</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={0} y={800} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 1)) }}>
          <Big size={44} color={C.green}>one agent, five good tools first · split only for a measured reason</Big>
        </Abs>
      )}
    </>
  );
};
