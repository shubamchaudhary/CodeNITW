// Chapter 12 scenes (going further): the manual vs a week of training, sticky
// notes on a book (LoRA), picking the better of two (DPO), master and
// apprentice (distillation), the bus that never waits (continuous batching),
// a smaller photo (quantisation), one USB-C port (MCP), and the whole
// FreshCart system lighting up, chapter by chapter.
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

// ------------------------------------------------------------------ the manual vs a week of training

export const Manual = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      {t.step === 0 && (
        <Abs x={260} y={360} w={1400} style={{ textAlign: "center", opacity: during(t, 0) }}>
          <div style={{ fontSize: 30, color: C.muted, ...rise(f, 4) }}>chapter 1 said: fine-tuning is the wrong tool for policies</div>
          <Big size={52} style={{ marginTop: 16, ...rise(f, 30) }}>so why is it the right tool now?</Big>
        </Abs>
      )}
      {t.step >= 1 && (
        <div style={{ opacity: from(t, 1) }}>
          <Abs x={160} y={290} w={760} style={{ ...card(C.blue), padding: "24px 30px", ...rise(f, at(t, 1)) }}>
            <div style={{ fontSize: 70 }}>📘</div>
            <div style={{ fontSize: 34, fontWeight: 800 }}>hand them the manual</div>
            <div style={{ fontSize: 27, color: C.muted, marginTop: 6 }}>facts: always current, easy to update, point at the page</div>
            <Chip color={C.blue} style={{ fontSize: 26, marginTop: 14 }}>= RAG</Chip>
          </Abs>
          {t.step >= 2 && (
            <Abs x={1000} y={290} w={760} style={{ ...card(C.green), padding: "24px 30px", ...rise(f, at(t, 2)) }}>
              <div style={{ fontSize: 70 }}>🏋️</div>
              <div style={{ fontSize: 34, fontWeight: 800 }}>train them for a week on one job</div>
              <div style={{ fontSize: 27, color: C.muted, marginTop: 6 }}>skills and habits: a format, a style, one narrow task</div>
              <Chip color={C.green} style={{ fontSize: 26, marginTop: 14 }}>= fine-tuning</Chip>
            </Abs>
          )}
          {t.step >= 3 && (
            <Abs x={160} y={680} w={1600} style={{ display: "flex", gap: 20, justifyContent: "center", ...rise(f, at(t, 3)) }}>
              <Chip color={C.green} style={{ fontSize: 26 }}>🏷️ the classifier: behaviour</Chip>
              <Chip color={C.green} style={{ fontSize: 26 }}>📣 the brand voice: behaviour</Chip>
              {t.step >= 4 && <Chip color={C.red} style={{ fontSize: 26, ...rise(f, at(t, 4)) }}>📚 12,000 policies: knowledge → still RAG</Chip>}
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ LoRA: sticky notes on a frozen book

export const StickyNotes = ({ t }: CP) => {
  const f = t.frame;
  const notes = [
    { label: "classifier", col: "#ffe58a", x: 620, y: 380 },
    { label: "brand voice", col: "#ffb7d5", x: 650, y: 540 },
  ];
  const swap = t.step >= 2 ? Math.floor((f - at(t, 2)) / 45) % 2 : -1;
  return (
    <>
      <Abs x={220} y={300} w={460} style={{ background: "#2a3550", borderRadius: 14, padding: "40px 30px", border: `3px solid ${C.line}`, boxShadow: "0 18px 50px rgba(0,0,0,.4)", ...rise(f, 4) }}>
        <div style={{ fontSize: 34, fontWeight: 900 }}>📕 the base model</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 10 }}>billions of weights</div>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} style={{ height: 10, borderRadius: 5, background: C.line, marginTop: 16, width: `${70 + rnd(i) * 30}%` }} />
        ))}
        {t.step >= 1 && <div style={{ fontSize: 30, fontWeight: 800, color: C.cyan, marginTop: 20, ...rise(f, at(t, 1)) }}>🔒 frozen</div>}
      </Abs>
      {t.step === 0 && (
        <Abs x={900} y={330} w={860} style={{ ...rise(f, 30) }}>
          <div style={{ ...card(C.red), padding: "22px 28px" }}>
            <div style={{ fontSize: 32, fontWeight: 800 }}>rewrite every weight?</div>
            <div style={{ fontSize: 27, color: C.muted, marginTop: 8 }}>lots of GPU memory · a full copy of the model for every task</div>
          </div>
        </Abs>
      )}
      {t.step >= 1 &&
        notes.map((n, i) => {
          const on = t.step < 2 ? i === 0 : swap === i;
          return (
            <Abs key={n.label} x={n.x} y={n.y} w={240} style={{ background: n.col, color: "#3a3000", borderRadius: 6, padding: "16px 18px", fontSize: 26, fontWeight: 800, transform: `rotate(${i ? 4 : -3}deg) scale(${on ? 1.06 : 0.94})`, opacity: (i === 0 ? Math.min(1, pop(f, at(t, 1) + 20)) : t.step >= 2 ? Math.min(1, pop(f, at(t, 2))) : 0) * (on ? 1 : 0.55), boxShadow: on ? "0 12px 30px rgba(0,0,0,.5)" : undefined }}>
              📝 {n.label}
              <div style={{ fontSize: 20, fontWeight: 600 }}>adapter · a few MB</div>
            </Abs>
          );
        })}
      {t.step >= 1 && (
        <Abs x={960} y={330} w={800} style={{ ...card(C.green), padding: "22px 28px", ...rise(f, at(t, 1) + 30) }}>
          <div style={{ fontSize: 30, fontWeight: 800 }}>train only two small matrices</div>
          <div style={{ fontSize: 27, color: C.muted, marginTop: 8 }}>often well under 1% of the model · their product is the correction</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={960} y={560} w={800} style={{ ...card(C.blue), padding: "22px 28px", ...rise(f, at(t, 2) + 10) }}>
          <div style={{ fontSize: 30, fontWeight: 800 }}>one base model, many adapters</div>
          <div style={{ fontSize: 27, color: C.muted, marginTop: 8 }}>swapped per request: now the {swap === 1 ? "brand voice" : "classifier"}</div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={960} y={790} w={800} style={{ ...rise(f, at(t, 3)) }}>
          <Chip color={C.purple} style={{ fontSize: 26 }}>QLoRA: base stored in 4-bit → one GPU</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ preference pairs: pick the better one

export const Pairs = ({ t }: CP) => {
  const f = t.frame;
  const push = t.step >= 2 ? ease(f, at(t, 2) + 20, 40) : 0;
  return (
    <>
      {[
        ["A", "🥛 Fresh milk, at your door by 7. Breakfast sorted!", true],
        ["B", "Notification: dairy products are now available for delivery.", false],
      ].map(([k, s, good], i) => (
        <Abs key={k as string} x={160 + i * 840} y={290} w={760} style={{ ...card(t.step >= 1 ? (good ? C.green : C.red) : C.line), padding: "22px 28px", ...rise(f, 4 + i * 16) }}>
          <div style={{ fontFamily: MONO, fontSize: 26, color: C.muted }}>option {k as string}</div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>{s as string}</div>
          {t.step >= 1 && <div style={{ fontSize: 28, fontWeight: 800, color: good ? C.green : C.red, marginTop: 10 }}>{good ? "✓ marketing picked this" : "✗ rejected"}</div>}
        </Abs>
      ))}
      {t.step === 0 && (
        <Abs x={0} y={600} w={1920} style={{ textAlign: "center", ...rise(f, 50) }}>
          <Big size={44}>picking the better one is easier than writing the perfect one</Big>
        </Abs>
      )}
      {t.step === 1 && (
        <Abs x={160} y={560} w={1600} style={{ ...card(C.purple), padding: "20px 26px", ...rise(f, at(t, 1) + 30) }}>
          <div style={{ fontSize: 30, fontWeight: 800 }}>RLHF</div>
          <div style={{ fontSize: 27, color: C.muted, marginTop: 6 }}>a reward model learns the picks, then trial and reward trains the model · powerful, complex</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={160} y={560} w={1600} style={{ ...card(C.green), padding: "20px 26px", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 30, fontWeight: 800 }}>DPO: train straight on the pairs</div>
          {[
            ["picked", 0.4 + 0.45 * push, C.green],
            ["rejected", 0.4 - 0.3 * push, C.red],
          ].map(([k, v, col]) => (
            <div key={k as string} style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
              <div style={{ width: 160, fontSize: 26 }}>{k as string}</div>
              <div style={{ flex: 1, height: 24, borderRadius: 12, background: C.card2 }}>
                <div style={{ height: 24, borderRadius: 12, width: `${(v as number) * 100}%`, background: col as string }} />
              </div>
              <div style={{ width: 200, fontSize: 24, color: C.muted }}>more / less likely</div>
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ distillation: master and apprentice, then a cascade

export const Apprentice = ({ t }: CP) => {
  const f = t.frame;
  const flow = ease(f, 30, 60);
  const cost = t.step >= 3 ? Math.round(lerp(600, 90, ease(f, at(t, 3) + 20, 40))) : 600;
  return (
    <>
      {t.step < 2 && (
        <div style={{ opacity: 1 - from(t, 2) }}>
          <Abs x={160} y={300} w={380} style={{ ...card(C.purple), padding: "22px 0", textAlign: "center", ...rise(f, 4) }}>
            <div style={{ fontSize: 80 }}>🧙</div>
            <div style={{ fontSize: 30, fontWeight: 800 }}>the master</div>
            <div style={{ fontSize: 24, color: C.muted }}>large model · slow · costly</div>
          </Abs>
          <Abs x={1380} y={300} w={380} style={{ ...card(C.green), padding: "22px 0", textAlign: "center", ...rise(f, 20) }}>
            <div style={{ fontSize: 80 }}>🧑‍🎓</div>
            <div style={{ fontSize: 30, fontWeight: 800 }}>the apprentice</div>
            <div style={{ fontSize: 24, color: C.muted }}>small model · fast · cheap</div>
          </Abs>
          {Array.from({ length: 8 }, (_, i) => {
            const p = clamp01(flow * 1.6 - i * 0.08);
            return (
              <Abs key={i} x={lerp(560, 1300, p)} y={360 + (i % 4) * 30} w={70} style={{ background: "#f4efe2", color: "#333", borderRadius: 4, padding: "4px 6px", fontSize: 16, fontFamily: MONO, opacity: p > 0 && p < 1 ? 1 : 0 }}>
                🏷️ label
              </Abs>
            );
          })}
          {t.step >= 1 && (
            <Abs x={160} y={620} w={1600} style={{ display: "flex", gap: 18, justifyContent: "center", ...rise(f, at(t, 1)) }}>
              {["the master labels 5–20k tickets", "people check the hard ones", "LoRA-tune the apprentice", "test on held-out tickets"].map((s, i) => (
                <Chip key={s} color={PALETTE[i]} style={{ fontSize: 26, opacity: enter(f, at(t, 1) + i * 14) }}>{i + 1}. {s}</Chip>
              ))}
            </Abs>
          )}
        </div>
      )}
      {t.step >= 2 && (
        <div style={{ opacity: from(t, 2) }}>
          <Abs x={140} y={330} w={300} style={{ ...card(C.blue), padding: "20px 0", textAlign: "center", fontSize: 30, fontWeight: 800 }}>🎫 ticket</Abs>
          <Abs x={560} y={330} w={420} style={{ ...card(C.green), padding: "20px 0", textAlign: "center", fontSize: 30, fontWeight: 800 }}>🧑‍🎓 small model</Abs>
          <Abs x={1120} y={260} w={640} style={{ ...card(C.green), padding: "16px 22px", fontSize: 27, ...rise(f, at(t, 2) + 20) }}>
            confident (90%) → answer in milliseconds
            <div style={{ fontSize: 22, color: C.muted, marginTop: 4 }}>“no bread in my bag” → missing_item</div>
          </Abs>
          <Abs x={1120} y={430} w={640} style={{ ...card(C.purple), padding: "16px 22px", fontSize: 27, ...rise(f, at(t, 2) + 50) }}>
            unsure (10%) → the large model
            <div style={{ fontSize: 22, color: C.muted, marginTop: 4 }}>“late again, third time, sort it out”</div>
          </Abs>
          {t.step >= 3 && (
            <Abs x={140} y={640} w={1640} style={{ textAlign: "center", ...rise(f, at(t, 3)) }}>
              <div style={{ fontSize: 30, color: C.muted }}>300,000 tickets a day</div>
              <div style={{ fontFamily: MONO, fontSize: 80, fontWeight: 800, color: cost < 200 ? C.green : C.amber }}>${cost} / day</div>
              <div style={{ fontSize: 26, color: C.muted }}>was $600 with the large model alone (illustrative prices)</div>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ batching: the bus that never waits

export const Bus = ({ t }: CP) => {
  const f = t.frame;
  const seats = 8;
  const local = t.step >= 1 ? f - at(t, Math.min(t.step, 2)) : 0;
  const len = (i: number) => 40 + Math.floor(rnd(i + 3) * 120);
  const seatState = (i: number) => {
    if (t.step === 1) return local < len(i) ? "busy" : "empty";
    if (t.step >= 2) return (local + i * 23) % len(i) < len(i) - 12 ? "busy" : "new";
    return i === 0 ? "busy" : "empty";
  };
  return (
    <>
      <Abs x={160} y={270} w={1600} style={{ fontSize: 34, fontWeight: 800, ...rise(f, 4) }}>
        {t.step === 0 ? "one request at a time: a bus with one passenger" : t.step === 1 ? "static batching: the bus waits for its last passenger" : "continuous batching: a seat frees, a new rider gets on"}
      </Abs>
      <Abs x={260} y={380} w={1400} style={{ background: "#2b5aa8", borderRadius: 40, padding: "40px 50px", display: "flex", gap: 22, ...rise(f, 10) }}>
        {Array.from({ length: seats }, (_, i) => {
          const s = seatState(i);
          return (
            <div key={i} style={{ flex: 1, height: 110, borderRadius: 16, background: s === "empty" ? "#1c3460" : s === "new" ? C.green : C.amber, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50 }}>
              {s === "empty" ? "" : "🧑"}
            </div>
          );
        })}
      </Abs>
      <Svg>
        {[400, 1520].map((x) => (
          <circle key={x} cx={x} cy={600} r={42} fill="#111" stroke={C.muted} strokeWidth={6} />
        ))}
      </Svg>
      {t.step === 1 && (
        <Abs x={260} y={690} w={1400} style={{ textAlign: "center", fontSize: 30, color: C.red, ...rise(f, at(t, 1) + 40) }}>
          short answers finish, their seats sit empty, new requests wait outside
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={260} y={690} w={1400} style={{ ...card(C.purple), padding: "18px 24px", ...rise(f, at(t, 3)) }}>
          <div style={{ fontSize: 30, fontWeight: 800 }}>what runs out first: memory for the KV cache</div>
          <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>PagedAttention hands it out in small pages, like an OS: little waste, many more riders</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ quantisation: a smaller photo

export const Photo = ({ t }: CP) => {
  const f = t.frame;
  const sizes: [string, number, string, string][] = [
    ["16-bit", 140, "several GPUs", C.red],
    ["8-bit", 70, "two GPUs", C.amber],
    ["4-bit", 38, "one large GPU", C.green],
  ];
  const shown = t.step >= 1 ? 3 : 1;
  return (
    <>
      <Abs x={160} y={270} w={900} style={{ fontSize: 32, fontWeight: 800, ...rise(f, 4) }}>a 70-billion-parameter model's weights</Abs>
      {sizes.slice(0, shown).map(([bits, gb, gpus, col], i) => (
        <Abs key={bits} x={160 + i * 420} y={360} w={380} style={{ textAlign: "center", opacity: Math.min(1, pop(f, i === 0 ? 10 : at(t, 1) + i * 20)) }}>
          <div style={{ height: 240, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div style={{ width: gb * 2.2, height: gb * 1.6, borderRadius: 10, background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, filter: `blur(${i * 0.8}px)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 + gb / 5 }}>🖼️</div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 800, color: col, marginTop: 14 }}>{bits} · ~{gb} GB</div>
          <div style={{ fontSize: 26, color: C.muted }}>{gpus}</div>
        </Abs>
      ))}
      {t.step >= 2 && (
        <Abs x={1420} y={360} w={380} style={{ ...card(C.amber), padding: "18px 22px", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>measure quality on your own test set</div>
          <div style={{ fontSize: 24, color: C.muted, marginTop: 6 }}>8-bit usually loses very little; 4-bit a bit more</div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={160} y={760} w={1640} style={{ display: "flex", gap: 14, alignItems: "center", ...rise(f, at(t, 3)) }}>
          <span style={{ fontSize: 28, fontWeight: 800 }}>speculative decoding:</span>
          {["a draft guesses 5 tokens", "the big model checks all 5 in one pass", "keeps the ones it agrees with"].map((s, i) => (
            <Chip key={s} color={PALETTE[i]} style={{ fontSize: 24, opacity: enter(f, at(t, 3) + i * 14) }}>{s}</Chip>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ MCP: one port instead of a tangle

export const UsbC = ({ t }: CP) => {
  const f = t.frame;
  const apps = ["Ask FreshCart", "Planner Copilot", "coding assistant"];
  const systems = ["inventory", "orders"];
  const ay = (i: number) => 320 + i * 170;
  const sy = (j: number) => 400 + j * 200;
  const tidy = t.step >= 1 ? ease(f, at(t, 1) + 20, 40) : 0;
  return (
    <>
      {apps.map((a, i) => (
        <Abs key={a} x={140} y={ay(i) - 40} w={340} style={{ ...card(C.blue), padding: "20px 0", textAlign: "center", fontSize: 28, fontWeight: 800, ...rise(f, 4 + i * 8) }}>{a}</Abs>
      ))}
      {systems.map((s, j) => (
        <Abs key={s} x={1440} y={sy(j) - 40} w={340} style={{ ...card(C.amber), padding: "20px 0", textAlign: "center", fontSize: 28, fontWeight: 800, ...rise(f, 20 + j * 8) }}>
          🗄️ {s}
        </Abs>
      ))}
      <Svg>
        {apps.map((_, i) =>
          systems.map((_, j) => {
            const mx = 960 + (rnd(i * 3 + j) - 0.5) * 300;
            const my = (ay(i) + sy(j)) / 2 + (rnd(i + j * 5) - 0.5) * 200;
            return (
              <path
                key={`${i}${j}`}
                d={`M480,${ay(i)} Q${lerp(mx, 900, tidy)},${lerp(my, ay(i), tidy)} ${lerp(1440, 880, tidy)},${lerp(sy(j), 500, tidy)}`}
                stroke={PALETTE[(i * 2 + j) % PALETTE.length]}
                strokeWidth={5}
                fill="none"
                opacity={enter(f, 30 + (i * 2 + j) * 6) * (1 - tidy * 0.2)}
              />
            );
          }),
        )}
        {t.step >= 1 && systems.map((_, j) => <line key={j} x1={1040} y1={500} x2={1440} y2={sy(j)} stroke={C.green} strokeWidth={6} opacity={tidy} />)}
      </Svg>
      {t.step === 0 && (
        <Abs x={560} y={820} w={800} style={{ textAlign: "center", fontSize: 30, color: C.red, ...rise(f, 70) }}>3 apps × 2 systems = 6 integrations to keep in sync</Abs>
      )}
      {t.step >= 1 && (
        <Abs x={880} y={440} w={160} style={{ ...card(C.green), padding: "14px 0", textAlign: "center", opacity: tidy }}>
          <div style={{ fontSize: 40 }}>🔌</div>
          <div style={{ fontSize: 26, fontWeight: 900 }}>MCP</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={560} y={820} w={800} style={{ display: "flex", gap: 14, justifyContent: "center", ...rise(f, at(t, 2)) }}>
          <Chip color={C.green} style={{ fontSize: 26 }}>tools</Chip>
          <Chip color={C.blue} style={{ fontSize: 26 }}>resources</Chip>
          <Chip color={C.purple} style={{ fontSize: 26 }}>prompts</Chip>
          <Chip color={C.amber} style={{ fontSize: 26 }}>N + M, not N × M</Chip>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={140} y={890} w={1640} style={{ textAlign: "center", ...rise(f, at(t, 3)) }}>
          <span style={{ fontSize: 26, color: C.red, fontWeight: 700 }}>a third-party server's descriptions are untrusted input · one server that reads and sends email holds two keys</span>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the whole FreshCart system, lighting up

export const System = ({ t }: CP) => {
  const f = t.frame;
  const boxes: { id: string; label: string; ch: string; x: number; y: number; step: number; col: string }[] = [
    { id: "models", label: "models: hosted + a distilled classifier", ch: "1 · 12", x: 140, y: 600, step: 1, col: C.purple },
    { id: "rag", label: "retrieval: chunks, hybrid search, reranking", ch: "2 · 3 · 4", x: 140, y: 470, step: 1, col: C.blue },
    { id: "wf", label: "workflows + agents on LangGraph", ch: "5 · 6", x: 700, y: 420, step: 2, col: C.green },
    { id: "tools", label: "tools + MCP servers", ch: "5 · 12", x: 1260, y: 470, step: 2, col: C.amber },
    { id: "mem", label: "checkpoints + memory", ch: "6", x: 1260, y: 600, step: 2, col: C.cyan },
    { id: "hitl", label: "approvals + staged writes", ch: "7", x: 700, y: 600, step: 3, col: C.pink },
    { id: "guard", label: "guardrails: injection, SQL, data", ch: "11", x: 140, y: 740, step: 3, col: C.red },
    { id: "evals", label: "evals: golden sets, judges, canaries", ch: "8 · 9", x: 1260, y: 740, step: 3, col: C.purple },
    { id: "gw", label: "gateway: auth, quotas, routing, caching", ch: "10 · 11", x: 700, y: 290, step: 4, col: C.blue },
  ];
  return (
    <>
      {t.step === 0 && (
        <Abs x={260} y={380} w={1400} style={{ textAlign: "center", opacity: during(t, 0) }}>
          <div style={{ fontSize: 30, color: C.muted, ...rise(f, 4) }}>twelve chapters ago</div>
          <Big size={52} style={{ marginTop: 14, ...rise(f, 20) }}>a plain chat model, and three confused questions</Big>
        </Abs>
      )}
      {t.step >= 1 && (
        <>
          <Abs x={700} y={250} w={520} style={{ textAlign: "center", fontSize: 26, color: C.muted, opacity: t.step >= 4 ? 0 : 1 }}>👩‍💼 support agents · planners</Abs>
          {boxes.map((b) =>
            t.step >= b.step ? (
              <Abs key={b.id} x={b.x} y={b.y} w={520} style={{ ...card(b.col), padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, opacity: Math.min(1, pop(f, at(t, b.step) + boxes.filter((o) => o.step === b.step).indexOf(b) * 14)), boxShadow: t.step === b.step ? `0 0 34px ${b.col}55` : undefined }}>
                <span style={{ fontSize: 25, fontWeight: 700 }}>{b.label}</span>
                <span style={{ fontFamily: MONO, fontSize: 22, color: b.col, flexShrink: 0 }}>ch {b.ch}</span>
              </Abs>
            ) : null,
          )}
        </>
      )}
      {t.step >= 5 && (
        <Abs x={140} y={860} w={1640} style={{ textAlign: "center", ...rise(f, at(t, 5)) }}>
          <Big size={36} color={C.amber}>every interview question is about one of these boxes, or an arrow between them</Big>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the last exercise

export const Finale = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      <Abs x={260} y={320} w={1400} style={{ textAlign: "center", ...rise(f, 4) }}>
        <div style={{ fontSize: 110 }}>✏️</div>
        <Big size={56} style={{ marginTop: 10 }}>close the book. redraw the system from memory.</Big>
      </Abs>
      {t.step >= 1 && (
        <Abs x={260} y={640} w={1400} style={{ textAlign: "center", ...rise(f, at(t, 1)) }}>
          <Big size={40} color={C.amber}>then pick any box, and explain out loud the problem that forced it to exist</Big>
        </Abs>
      )}
    </>
  );
};
