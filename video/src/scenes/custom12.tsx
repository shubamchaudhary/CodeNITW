// Chapter 10 scenes (designing LLM systems): the 7-step route, napkin numbers,
// tenants as flats with walls, a latency budget, rails vs a car, the cage
// every agent needs, and a saga that undoes itself.
// Widths only, never heights; the top-right corner stays free for the term card.
import type { ReactNode } from "react";
import type { Clock } from "../lib/timeline.ts";
import { C, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, Big, clamp01, during, from } from "./custom3.tsx";

type CP = { t: Clock; props?: Record<string, unknown> };

const Svg = ({ children }: { children: ReactNode }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

// ------------------------------------------------------------------ the review: boxes first vs people first

export const Review = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      <Abs x={160} y={260} w={760} style={{ ...rise(f, 4) }}>
        <div style={{ fontSize: 30, color: C.muted }}>🗓️ Thursday · 45 minutes · one whiteboard</div>
        <div style={{ fontSize: 44, fontWeight: 800, marginTop: 10 }}>“Ask FreshCart for everyone”</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={160} y={460} w={760} style={{ ...card(C.red), padding: "22px 28px", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 26, color: C.red, fontWeight: 800 }}>weak: boxes first</div>
          <div style={{ display: "flex", gap: 14, marginTop: 14, alignItems: "center", fontSize: 28 }}>
            <span style={{ ...card(), padding: "10px 18px" }}>vector DB</span>+<span style={{ ...card(), padding: "10px 18px" }}>LLM</span>= <span style={{ color: C.muted }}>done?</span>
          </div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1000} y={300} w={780} style={{ ...card(C.green), padding: "22px 28px", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 26, color: C.green, fontWeight: 800 }}>strong: start with</div>
          {[
            ["🧑‍🤝‍🧑", "the people", "who asks, and why"],
            ["🔢", "the numbers", "how many, how fast"],
            ["💥", "the cost of being wrong", "a bad answer, a wrong refund"],
          ].map(([i, h, s], k) => (
            <div key={h} style={{ display: "flex", gap: 16, alignItems: "center", padding: "12px 0", borderTop: k ? `1px solid ${C.line}` : undefined, ...rise(f, at(t, 2) + 20 + k * 16, 10) }}>
              <span style={{ fontSize: 44 }}>{i}</span>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800 }}>{h}</div>
                <div style={{ fontSize: 24, color: C.muted }}>{s}</div>
              </div>
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the 7-step route

export const Route = ({ t }: CP) => {
  const f = t.frame;
  const stops = [
    ["clarify", "users, scale, risk"],
    ["success", "metric + baseline"],
    ["simplest first", "call → RAG → workflow → agent"],
    ["components", "gateway, data, tools"],
    ["eval plan", "golden set, judges, gate"],
    ["cost + latency", "with numbers"],
    ["failures + launch", "fallbacks, canary"],
  ];
  const on = (i: number) => t.step === 0 || i < [0, 2, 4, 7][Math.min(3, t.step)];
  const hot = (i: number) => (t.step === 1 && i < 2) || (t.step === 2 && (i === 2 || i === 3)) || (t.step === 3 && i >= 4);
  const x = (i: number) => 150 + i * 245;
  return (
    <>
      <Svg>
        <path d={`M${x(0) + 60},540 L${x(6) + 60},540`} stroke={C.line} strokeWidth={10} strokeLinecap="round" />
        <path d={`M${x(0) + 60},540 L${lerp(x(0) + 60, x(6) + 60, ease(f, 10, 100))},540`} stroke={C.blue} strokeWidth={10} strokeLinecap="round" />
      </Svg>
      {stops.map(([h, s], i) => (
        <Abs key={h} x={x(i) - 40} y={i % 2 ? 580 : 320} w={200} style={{ ...card(hot(i) ? (i >= 4 ? C.amber : C.green) : C.line), padding: "14px 14px", textAlign: "center", opacity: enter(f, 20 + i * 14) * (on(i) ? 1 : 0.5) }}>
          <div style={{ fontFamily: MONO, fontSize: 24, color: C.muted }}>{i + 1}</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{h}</div>
          <div style={{ fontSize: 20, color: C.muted, marginTop: 4 }}>{s}</div>
        </Abs>
      ))}
      <Svg>
        {stops.map((_, i) => (
          <circle key={i} cx={x(i) + 60} cy={540} r={16} fill={hot(i) ? (i >= 4 ? C.amber : C.green) : C.card2} stroke={C.text} strokeWidth={3} opacity={enter(f, 20 + i * 14)} />
        ))}
      </Svg>
      {t.step >= 3 && (
        <Abs x={0} y={820} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 3) + 20) }}>
          <Big size={40} color={C.amber}>evals, budgets, failures: the three things weak answers leave out</Big>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ napkin numbers and Little's law

export const Napkin = ({ t }: CP) => {
  const f = t.frame;
  const inflight = t.step >= 1 ? Math.round(150 * ease(f, at(t, 1) + 40, 40)) : 0;
  return (
    <>
      <Abs x={160} y={260} w={900} style={{ background: "#f4efe2", color: "#2a2a2a", borderRadius: 14, padding: "30px 36px", transform: "rotate(-1deg)", boxShadow: "0 18px 50px rgba(0,0,0,.4)", ...rise(f, 4) }}>
        <div style={{ fontSize: 28, fontWeight: 900 }}>🧻 the napkin</div>
        <div style={{ fontFamily: MONO, fontSize: 32, marginTop: 16 }}>1,000,000 questions / day</div>
        <div style={{ fontFamily: MONO, fontSize: 32, marginTop: 8, opacity: enter(f, 40) }}>peak ≈ 50 / second</div>
        {t.step >= 1 && (
          <>
            <div style={{ fontFamily: MONO, fontSize: 32, marginTop: 8, ...rise(f, at(t, 1)) }}>× 3 seconds per answer</div>
            <div style={{ fontFamily: MONO, fontSize: 40, fontWeight: 800, marginTop: 14, color: "#b5480f", ...rise(f, at(t, 1) + 30) }}>= {inflight} calls in flight</div>
          </>
        )}
      </Abs>
      {t.step >= 1 && (
        <Abs x={1140} y={300} w={640} style={{ ...card(C.blue), padding: "20px 26px", ...rise(f, at(t, 1) + 10) }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>in flight = rate × time</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
            {Array.from({ length: 150 }, (_, i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: 4, background: i < inflight ? C.blue : C.card2 }} />
            ))}
          </div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={160} y={720} w={1620} style={{ textAlign: "center", ...rise(f, at(t, 2)) }}>
          <Big size={40} color={C.amber}>this number, not the daily total, meets the provider's rate limit</Big>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ tenants: flats with walls, a shared lobby

export const Tenants = ({ t }: CP) => {
  const f = t.frame;
  const flats = ["blr-north", "pune-east", "mum-west", "hyd-1", "del-2", "chn-3"];
  return (
    <>
      {t.step === 0 && (
        <div style={{ opacity: during(t, 0) }}>
          <Abs x={360} y={260} w={1200} style={{ ...card(C.blue), padding: "18px 26px", textAlign: "center", ...rise(f, 4) }}>
            <div style={{ fontSize: 30, fontWeight: 800 }}>🏛️ shared lobby: FreshCart's 12,000 documents</div>
          </Abs>
          {flats.map((n, i) => (
            <Abs key={n} x={360 + (i % 3) * 410} y={400 + Math.floor(i / 3) * 190} w={380} style={{ ...card(PALETTE[i]), padding: "18px 0", textAlign: "center", opacity: Math.min(1, pop(f, 30 + i * 8)) }}>
              <div style={{ fontSize: 40 }}>🔒</div>
              <div style={{ fontFamily: MONO, fontSize: 26 }}>{n}</div>
              <div style={{ fontSize: 22, color: C.muted }}>~500 private docs</div>
            </Abs>
          ))}
        </div>
      )}
      {t.step >= 1 && t.step < 3 && (
        <div style={{ opacity: from(t, 1) * (1 - from(t, 3)) }}>
          <Abs x={160} y={290} w={760} style={{ ...card(C.green), padding: "22px 28px", ...rise(f, at(t, 1)) }}>
            <div style={{ fontSize: 32, fontWeight: 800 }}>an index per franchise</div>
            <div style={{ fontSize: 26, color: C.green, marginTop: 10 }}>+ strong walls · easy to delete a franchise</div>
            <div style={{ fontSize: 26, color: C.red, marginTop: 6 }}>− 40 indexes to run</div>
          </Abs>
          <Abs x={1000} y={290} w={760} style={{ ...card(C.amber), padding: "22px 28px", ...rise(f, at(t, 1) + 30) }}>
            <div style={{ fontSize: 32, fontWeight: 800 }}>one index + a mandatory filter</div>
            <div style={{ fontSize: 26, color: C.green, marginTop: 10 }}>+ efficient</div>
            <div style={{ fontSize: 26, color: C.red, marginTop: 6 }}>− one bug leaks across franchises</div>
          </Abs>
          {t.step >= 2 && (
            <Abs x={160} y={560} w={1600} style={{ ...card(C.blue), padding: "22px 28px", ...rise(f, at(t, 2)) }}>
              <div style={{ fontSize: 30, fontWeight: 800 }}>FreshCart: shared docs together · big franchises get their own partition</div>
              <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>and the franchise filter is enforced below the app, by the database itself (row-level security)</div>
            </Abs>
          )}
        </div>
      )}
      {t.step >= 3 && (
        <div style={{ opacity: from(t, 3) }}>
          <Abs x={160} y={300} w={760} style={{ ...card(C.red), padding: "22px 28px", ...rise(f, at(t, 3)) }}>
            <div style={{ fontSize: 26, color: C.muted }}>in the prompt</div>
            <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>“Only use documents the user may see.”</div>
            <div style={{ fontSize: 26, color: C.red, marginTop: 8 }}>a sign on the door</div>
          </Abs>
          <Abs x={1000} y={300} w={760} style={{ ...card(C.green), padding: "22px 28px", ...rise(f, at(t, 3) + 30) }}>
            <div style={{ fontSize: 26, color: C.muted }}>at retrieval</div>
            <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>forbidden chunks never reach the prompt</div>
            <div style={{ fontSize: 26, color: C.green, marginTop: 8 }}>a lock on the door 🔒</div>
          </Abs>
          {t.step >= 4 && (
            <Abs x={160} y={600} w={1600} style={{ textAlign: "center", ...rise(f, at(t, 4)) }}>
              <Chip color={C.purple} style={{ fontSize: 28 }}>access stored by group · revoke a person without re-indexing</Chip>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the 2-second latency budget

export const Budget = ({ t }: CP) => {
  const f = t.frame;
  const parts: [string, number, string][] = [
    ["who + groups", 50, C.muted],
    ["embed", 30, C.purple],
    ["search", 80, C.blue],
    ["rerank", 150, C.cyan],
    ["prompt", 20, C.muted],
    ["model's first word", 1000, C.amber],
  ];
  const scale = 1500 / 2000;
  let acc = 0;
  return (
    <>
      <Abs x={160} y={270} w={1200} style={{ fontSize: 32, fontWeight: 800, ...rise(f, 4) }}>first words within 2 seconds: spend it like money</Abs>
      <Abs x={160} y={360} w={1600}>
        <div style={{ position: "relative", height: 90 }}>
          {parts.map(([n, ms, col], i) => {
            const left = acc * scale;
            acc += ms;
            const w = ms * scale * ease(f, 20 + i * 14, 18);
            return (
              <div key={n} style={{ position: "absolute", left, width: w, top: 0, height: 90, background: col, borderRadius: 6, border: `2px solid ${C.bg}` }} />
            );
          })}
          <div style={{ position: "absolute", left: 2000 * scale, top: -20, width: 4, height: 130, background: C.red }} />
        </div>
      </Abs>
      <Abs x={160} y={480} w={1600} style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {parts.map(([n, ms, col], i) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 10, background: C.card, border: `2px solid ${col}`, fontSize: 24, opacity: enter(f, 30 + i * 14) }}>
            {n}
            <span style={{ fontFamily: MONO, color: col }}>{ms} ms</span>
          </div>
        ))}
      </Abs>
      <Abs x={160 + 2000 * scale - 60} y={300} w={140} style={{ textAlign: "center", fontFamily: MONO, fontSize: 24, color: C.red }}>2.0 s</Abs>
      {t.step >= 1 && (
        <Abs x={160} y={620} w={1600} style={{ display: "flex", gap: 16, flexWrap: "wrap", ...rise(f, at(t, 1)) }}>
          <span style={{ fontSize: 28, fontWeight: 800, marginRight: 8 }}>over budget?</span>
          {["skip rerank on simple questions", "fewer chunks", "a faster model", "cache frequent questions"].map((s) => (
            <Chip key={s} color={C.green} style={{ fontSize: 24 }}>{s}</Chip>
          ))}
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={160} y={730} w={1600} style={{ display: "flex", gap: 16, flexWrap: "wrap", ...rise(f, at(t, 2)) }}>
          <span style={{ fontSize: 28, fontWeight: 800, marginRight: 8 }}>when it fails:</span>
          {["vector index down → keyword only", "provider down → tested fallback model", "doc deleted → gone within 5 min"].map((s) => (
            <Chip key={s} color={C.amber} style={{ fontSize: 24 }}>{s}</Chip>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ rails vs a car

export const Rails = ({ t }: CP) => {
  const f = t.frame;
  const train = t.step >= 1 ? clamp01((f - at(t, 1) - 10) / 120) : 0;
  const car = t.step >= 2 ? (f - at(t, 2)) / 30 : 0;
  return (
    <>
      {t.step === 0 && (
        <Abs x={260} y={360} w={1400} style={{ textAlign: "center", opacity: during(t, 0) }}>
          <div style={{ fontSize: 30, color: C.muted, ...rise(f, 4) }}>from the leadership offsite</div>
          <Big size={58} style={{ marginTop: 14 }}>“make it fully autonomous. let the AI decide everything.”</Big>
        </Abs>
      )}
      {t.step >= 1 && (
        <div style={{ opacity: from(t, 1) }}>
          <Abs x={160} y={270} w={760} style={{ fontSize: 32, fontWeight: 800, color: C.blue }}>workflow: your code lays the rails</Abs>
          <Svg>
            <line x1={180} y1={420} x2={900} y2={420} stroke={C.muted} strokeWidth={4} />
            <line x1={180} y1={444} x2={900} y2={444} stroke={C.muted} strokeWidth={4} />
            {[180, 420, 660, 900].map((x) => (
              <circle key={x} cx={x} cy={432} r={14} fill={C.blue} />
            ))}
          </Svg>
          {["classify", "search", "draft", "reply"].map((s, i) => (
            <Abs key={s} x={120 + i * 240} y={470} w={120} style={{ textAlign: "center", fontSize: 24, color: C.muted }}>{s}</Abs>
          ))}
          <Abs x={lerp(150, 860, train)} y={360} w={80} style={{ fontSize: 56 }}>🚆</Abs>
          {t.step >= 2 && (
            <>
              <Abs x={1000} y={270} w={760} style={{ fontSize: 32, fontWeight: 800, color: C.amber, ...rise(f, at(t, 2)) }}>agent: the model drives</Abs>
              <Svg>
                <path d="M1020,460 C1150,300 1300,560 1420,380 S1700,500 1740,360" stroke={C.line} strokeWidth={4} strokeDasharray="10 10" fill="none" />
              </Svg>
              <Abs x={1000 + ((car * 60) % 700)} y={400 + Math.sin(car) * 60} w={80} style={{ fontSize: 56 }}>🚗</Abs>
            </>
          )}
          {t.step >= 3 && (
            <Abs x={160} y={640} w={1600} style={{ display: "flex", gap: 18, alignItems: "center", justifyContent: "center", ...rise(f, at(t, 3)) }}>
              {["one call", "+ retrieval, tools", "workflow", "agent"].map((s, i) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <div style={{ ...card(i === 2 ? C.green : C.line), padding: "14px 24px", fontSize: 28, fontWeight: 800, transform: `translateY(${-i * 18}px)` }}>{s}</div>
                  {i < 3 && <span style={{ fontSize: 30, color: C.muted }}>↗</span>}
                </div>
              ))}
            </Abs>
          )}
          {t.step >= 3 && (
            <Abs x={160} y={790} w={1600} style={{ textAlign: "center", fontSize: 30, color: C.green, fontWeight: 700, ...rise(f, at(t, 3) + 40) }}>
              climb a rung only when tests show the lower one failing · Ask FreshCart stays a workflow
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the cage every agent needs

export const Cage = ({ t }: CP) => {
  const f = t.frame;
  const bars = [
    ["⏱️", "budgets: steps, tokens, time", 1],
    ["🪪", "tools act as the user", 1],
    ["✋", "approval for big writes", 1],
    ["🔑", "idempotency keys", 2],
    ["✅", "validate arguments + output", 2],
    ["🩻", "trace every step", 2],
    ["🗄️", "confirm in the database", 2],
  ];
  const cx = 960;
  const cy = 560;
  return (
    <>
      <Abs x={cx - 110} y={cy - 90} w={220} style={{ ...card(C.amber), padding: "18px 0", textAlign: "center", ...rise(f, 4) }}>
        <div style={{ fontSize: 60 }}>🤖</div>
        <div style={{ fontSize: 26, fontWeight: 800 }}>agent loop</div>
      </Abs>
      <Svg>
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const show = t.step >= 1 ? enter(f, at(t, 1) + i * 3) : 0;
          return <line key={i} x1={cx + Math.cos(a) * 170} y1={cy + Math.sin(a) * 150} x2={cx + Math.cos(a) * 200} y2={cy + Math.sin(a) * 180} stroke={C.muted} strokeWidth={6} opacity={show} />;
        })}
      </Svg>
      {bars.map(([icon, s, st], i) => {
        const a = (i / bars.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * 560;
        const y = cy + Math.sin(a) * 250;
        return t.step >= (st as number) ? (
          <Abs key={s as string} x={x - 190} y={y - 32} w={380} style={{ ...card(C.green), padding: "12px 16px", textAlign: "center", fontSize: 24, fontWeight: 700, opacity: Math.min(1, pop(f, at(t, st as number) + i * 10)) }}>
            {icon} {s}
          </Abs>
        ) : null;
      })}
      {t.step === 0 && (
        <Abs x={0} y={800} w={1920} style={{ textAlign: "center", ...rise(f, 30) }}>
          <Big size={40}>only where the steps truly can't be known in advance</Big>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ a saga: steps with undo

export const Saga = ({ t }: CP) => {
  const f = t.frame;
  const fail = t.step >= 1 && f > at(t, 1) + 60;
  const undo = t.step >= 2 ? ease(f, at(t, 2) + 30, 30) : 0;
  return (
    <>
      {t.step === 0 && (
        <div style={{ opacity: during(t, 0) }}>
          {[
            ["query_settings", "read", C.green],
            ["simulate_change", "what-if, on a copy", C.green],
            ["propose_change", "to the overlay only", C.amber],
            ["commit_change", "only the approval step can call it", C.red],
          ].map(([n, s, col], i) => (
            <Abs key={n} x={260 + i * 360} y={360} w={330} style={{ ...card(col), padding: "18px 16px", textAlign: "center", opacity: Math.min(1, pop(f, 10 + i * 14)) }}>
              <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700 }}>{n}</div>
              <div style={{ fontSize: 22, color: C.muted, marginTop: 6 }}>{s}</div>
            </Abs>
          ))}
          <Abs x={0} y={600} w={1920} style={{ textAlign: "center", fontSize: 30, color: C.muted, ...rise(f, 80) }}>every call carries the planner's identity and permissions</Abs>
        </div>
      )}
      {t.step >= 1 && (
        <div style={{ opacity: from(t, 1) }}>
          <Abs x={200} y={330} w={560} style={{ ...card(undo > 0.5 ? C.muted : C.green), padding: "22px 26px", ...rise(f, at(t, 1)) }}>
            <div style={{ fontSize: 26, color: C.muted }}>step 1 · planning DB</div>
            <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6 }}>safety stock 400 → 480 {undo > 0.5 ? "↩" : "✓"}</div>
          </Abs>
          <Abs x={1000} y={330} w={620} style={{ ...card(fail ? C.red : C.line), padding: "22px 26px", ...rise(f, at(t, 1) + 30) }}>
            <div style={{ fontSize: 26, color: C.muted }}>step 2 · supplier's system</div>
            <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6 }}>update the purchase order {fail ? "✗" : "…"}</div>
          </Abs>
          {fail && t.step === 1 && (
            <Abs x={0} y={560} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 1) + 70) }}>
              <Big size={42} color={C.red}>half-changed, and no transaction spans both systems</Big>
            </Abs>
          )}
          {t.step >= 2 && (
            <>
              <Svg>
                <path d={`M1300,470 C1300,${560 + 40 * undo} 500,${560 + 40 * undo} 480,480`} stroke={C.amber} strokeWidth={5} fill="none" strokeDasharray="12 10" opacity={undo} />
              </Svg>
              <Abs x={560} y={620} w={800} style={{ ...card(C.amber), padding: "16px 24px", textAlign: "center", fontSize: 30, fontWeight: 700, opacity: undo }}>
                compensate: put safety stock back to 400, and tell the planner why
              </Abs>
            </>
          )}
          {t.step >= 3 && (
            <Abs x={160} y={790} w={1600} style={{ display: "flex", gap: 18, justifyContent: "center", ...rise(f, at(t, 3)) }}>
              <Chip color={C.purple} style={{ fontSize: 26 }}>every step idempotent</Chip>
              <Chip color={C.purple} style={{ fontSize: 26 }}>checkpoints record what finished: a crash resumes or undoes</Chip>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};
