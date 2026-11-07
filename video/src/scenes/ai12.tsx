// Chapter 12 (Going further), told with general examples: a ticket classifier
// to shrink, a model to self-host, and one CRM shared by three assistants.
import { C, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, rnd } from "./custom3.tsx";
import { Arrow, Svg, type CP } from "./secui.tsx";

// ------------------------------------------------------------------ hook

export const A12Hook = ({ t }: CP) => {
  const f = t.frame;
  const reqs: [string, string, string][] = [
    ["🏷️", "A ticket classifier, 300,000 a day", "95% accurate, but 1.2 s and too expensive per ticket · plus a “brand voice” prompting can't quite reach"],
    ["🏛️", "Legal: keep data in our own cloud", "which means running a model yourself"],
    ["🔌", "One CRM, three assistants", "support bot, sales copilot, coding assistant: without three integrations"],
  ];
  return (
    <Abs x={80} y={200} w={1760} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {reqs.map(([i, a, b], k) =>
        t.step >= k ? (
          <div key={a} style={{ ...card(t.step === k ? PALETTE[k] : C.line), padding: "22px 28px", display: "flex", gap: 24, alignItems: "center", ...rise(f, at(t, k)) }}>
            <div style={{ fontSize: 60 }}>{i}</div>
            <div>
              <div style={{ fontSize: 36, fontWeight: 800 }}>{a}</div>
              <div style={{ fontSize: 27, color: C.muted, marginTop: 4 }}>{b}</div>
            </div>
          </div>
        ) : null,
      )}
    </Abs>
  );
};

// ------------------------------------------------------------------ LoRA

export const A12Lora = ({ t }: CP) => {
  const f = t.frame;
  const cells = 12;
  const S = 22;
  return (
    <>
      <Abs x={120} y={260} w={cells * S + 40} style={{ textAlign: "center", ...rise(f, 4) }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cells}, ${S}px)`, gap: 2, justifyContent: "center" }}>
          {Array.from({ length: cells * cells }, (_, i) => (
            <div key={i} style={{ width: S, height: S, borderRadius: 3, background: `rgba(91,156,255,${0.2 + 0.5 * rnd(i)})` }} />
          ))}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, marginTop: 10 }}>W · frozen 🔒</div>
        <div style={{ fontFamily: MONO, fontSize: 22, color: C.muted }}>4096 × 4096 = 16.8M</div>
      </Abs>
      {t.step >= 1 && (
        <>
          <Abs x={460} y={330} w={60} style={{ fontSize: 60, fontWeight: 900, ...rise(f, at(t, 1)) }}>
            +
          </Abs>
          <Abs x={540} y={260} w={60} style={{ textAlign: "center", ...rise(f, at(t, 1) + 6) }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(2, ${S}px)`, gap: 2 }}>
              {Array.from({ length: cells * 2 }, (_, i) => (
                <div key={i} style={{ width: S, height: S, borderRadius: 3, background: `${C.green}cc` }} />
              ))}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 10, color: C.green }}>B</div>
          </Abs>
          <Abs x={620} y={260} w={cells * S + 30} style={{ textAlign: "center", ...rise(f, at(t, 1) + 12) }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cells}, ${S}px)`, gap: 2 }}>
              {Array.from({ length: cells * 2 }, (_, i) => (
                <div key={i} style={{ width: S, height: S, borderRadius: 3, background: `${C.amber}cc` }} />
              ))}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 10, color: C.amber }}>A</div>
          </Abs>
        </>
      )}
      <Abs x={960} y={260} w={880} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {t.step >= 1 && (
          <div style={{ ...card(C.green), padding: "16px 22px", ...rise(f, at(t, 1) + 20) }}>
            <div style={{ fontFamily: MONO, fontSize: 32 }}>W′ = W + B·A</div>
            <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>B is 4096 × r, A is r × 4096 · only B and A are trained</div>
          </div>
        )}
        {t.step >= 2 && (
          <div style={{ ...card(C.amber), padding: "16px 22px", ...rise(f, at(t, 2)) }}>
            <div style={{ fontSize: 30, fontWeight: 800 }}>rank r = 8 → 65,536 trainable</div>
            <div style={{ fontSize: 26, color: C.muted, marginTop: 4 }}>0.4% of this matrix · higher r = more capacity, more memory</div>
          </div>
        )}
        {t.step >= 3 && (
          <div style={{ ...card(C.blue), padding: "16px 22px", ...rise(f, at(t, 3)) }}>
            <div style={{ fontSize: 30, fontWeight: 800 }}>a small adapter file per task</div>
            <div style={{ fontSize: 26, color: C.muted, marginTop: 4 }}>one base model, many adapters, swapped per request</div>
          </div>
        )}
        {t.step >= 4 && (
          <div style={{ ...card(C.purple), padding: "16px 22px", ...rise(f, at(t, 4)) }}>
            <div style={{ fontSize: 30, fontWeight: 800 }}>QLoRA: base stored in 4-bit</div>
            <div style={{ fontSize: 26, color: C.muted, marginTop: 4 }}>large models fine-tuned on a single GPU</div>
          </div>
        )}
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ RLHF vs DPO

export const A12Dpo = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      <Abs x={80} y={270} w={1760} style={{ display: "flex", gap: 24, ...rise(f, 4) }}>
        <div style={{ flex: 1, ...card(C.green), padding: "16px 22px" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.green, letterSpacing: 2 }}>CHOSEN</div>
          <div style={{ fontSize: 28, marginTop: 6 }}>“Your order's on its way: arriving by 6 pm 🚚”</div>
        </div>
        <div style={{ flex: 1, ...card(C.red), padding: "16px 22px" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.red, letterSpacing: 2 }}>REJECTED</div>
          <div style={{ fontSize: 28, marginTop: 6 }}>“Dear valued customer, we wish to inform you that your order has been dispatched.”</div>
        </div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={80} y={470} w={860} style={{ ...card(C.amber), padding: "18px 24px", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.amber }}>RLHF</div>
          <div style={{ fontSize: 27, marginTop: 8, lineHeight: 1.4 }}>pairs → train a reward model → RL pushes the model toward high reward, with a KL penalty for drifting from the original</div>
          <div style={{ fontSize: 24, color: C.muted, marginTop: 6 }}>powerful, complex to run</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={980} y={470} w={860} style={{ ...card(C.blue), padding: "18px 24px", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.blue }}>Bradley–Terry</div>
          <div style={{ fontFamily: MONO, fontSize: 30, marginTop: 8 }}>P(chosen ≻ rejected) = σ(r_c − r_r)</div>
          <div style={{ fontSize: 24, color: C.muted, marginTop: 6 }}>a preference is a score difference through a sigmoid</div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={720} w={1760} style={{ ...card(C.green), padding: "18px 24px", ...rise(f, at(t, 3)) }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.green }}>DPO: no reward model, no RL</div>
          <div style={{ fontFamily: MONO, fontSize: 26, marginTop: 8 }}>loss = −log σ( β·[ log π(c)/π_ref(c) − log π(r)/π_ref(r) ] )</div>
          <div style={{ fontSize: 24, color: C.muted, marginTop: 4 }}>raise the chosen answer's likelihood relative to the reference, lower the rejected · β plays the KL role</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ distillation + cascade

export const A12Distill = ({ t }: CP) => {
  const f = t.frame;
  const share = t.step >= 2 ? ease(f, at(t, 2), 30) : 0;
  return (
    <>
      <Abs x={80} y={290} w={460} style={{ ...card(C.purple), padding: "20px 0", textAlign: "center", ...rise(f, 4) }}>
        <div style={{ fontSize: 70 }}>🧠</div>
        <div style={{ fontSize: 30, fontWeight: 800 }}>large model (teacher)</div>
        <div style={{ fontSize: 24, color: C.muted }}>labels 50,000 tickets · people review the hard ones</div>
      </Abs>
      <Svg>
        <Arrow x1={550} y1={380} x2={720} y2={380} color={C.purple} p={ease(f, 20, 20)} />
      </Svg>
      <Abs x={730} y={290} w={460} style={{ ...card(C.green), padding: "20px 0", textAlign: "center", ...rise(f, 24) }}>
        <div style={{ fontSize: 50 }}>🐣</div>
        <div style={{ fontSize: 30, fontWeight: 800 }}>small model (student)</div>
        <div style={{ fontSize: 24, color: C.muted }}>fine-tuned on those labels</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={1260} y={290} w={580} style={{ ...card(C.amber), padding: "18px 24px", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 30, fontWeight: 800 }}>cascade</div>
          <div style={{ fontSize: 26, marginTop: 6, lineHeight: 1.4 }}>small model first · confidence &lt; 0.85 → send to the large model</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={80} y={590} w={1760} style={{ ...rise(f, at(t, 2)) }}>
          <div style={{ display: "flex", height: 70, borderRadius: 12, overflow: "hidden", border: `2px solid ${C.line}` }}>
            <div style={{ width: `${90 * share}%`, background: `${C.green}88`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800 }}>90% small · ms</div>
            <div style={{ flex: 1, background: `${C.purple}88`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800 }}>10% large</div>
          </div>
          <div style={{ display: "flex", gap: 30, marginTop: 20, fontFamily: MONO, fontSize: 32 }}>
            <span style={{ color: C.red }}>large only: $600 / day</span>
            <span style={{ color: C.green }}>cascade: ≈ $90 / day</span>
          </div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={820} w={1760} style={{ ...rise(f, at(t, 3)) }}>
          <Chip color={C.amber} style={{ fontSize: 26 }}>
            tune the threshold on held-out tickets so combined accuracy matches the large model · check the provider's terms first
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ prefill vs decode

export const A12Phases = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      <Abs x={80} y={230} w={860} style={{ ...card(C.blue), padding: "22px 28px", ...rise(f, 4) }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: C.blue }}>Prefill</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
          {Array.from({ length: 40 }, (_, i) => (
            <div key={i} style={{ width: 30, height: 30, borderRadius: 6, background: C.blue, opacity: enter(f, 12, 8) }} />
          ))}
        </div>
        <div style={{ fontSize: 27, marginTop: 14, lineHeight: 1.4 }}>the whole prompt at once · heavy compute · <b>compute-bound</b></div>
        <div style={{ fontSize: 25, color: C.muted, marginTop: 4 }}>decides time to first token</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={980} y={230} w={860} style={{ ...card(C.green), padding: "22px 28px", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: C.green }}>Decode</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
            {Array.from({ length: Math.min(12, Math.floor((f - at(t, 1)) / 8)) }, (_, i) => (
              <div key={i} style={{ width: 30, height: 30, borderRadius: 6, background: C.green }} />
            ))}
          </div>
          <div style={{ fontSize: 27, marginTop: 14, lineHeight: 1.4 }}>one token per step · weights + KV cache re-read each time · <b>memory-bound</b></div>
          <div style={{ fontSize: 25, color: C.muted, marginTop: 4 }}>decides time per output token</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={80} y={620} w={1760} style={{ ...rise(f, at(t, 2)) }}>
          <Chip color={C.amber} style={{ fontSize: 28 }}>
            one request at a time leaves the GPU mostly idle during decode → serve many at once
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ static vs continuous batching

const LENS = [6, 14, 4, 10];
const QUEUE = [5, 8, 3, 7, 4, 6];

export const A12Bus = ({ t }: CP) => {
  const f = t.frame;
  const contin = t.step >= 1;
  const start = contin ? at(t, 1) : 10;
  const tick = Math.floor(Math.max(0, f - start) / 6);
  const CW = 46;
  // continuous: each slot pulls the next queued request when its current one finishes
  const slots = LENS.map((len, s) => {
    const segs: [number, number, number][] = [[0, len, s]];
    let end = len;
    let q = s;
    while (contin && q < QUEUE.length && end < 24) {
      segs.push([end, QUEUE[q], 4 + q]);
      end += QUEUE[q];
      q += LENS.length;
    }
    return segs;
  });
  const longest = Math.max(...LENS);
  return (
    <>
      <Abs x={80} y={190} w={1220} style={{ fontSize: 32, fontWeight: 800, ...rise(f, 2) }}>
        {contin ? "Continuous batching: a freed slot is refilled at the next step" : "Static batching: the batch waits for its longest request"}
      </Abs>
      {slots.map((segs, s) => (
        <Abs key={s} x={80} y={300 + s * 90} w={1500} h={64} style={{ borderRadius: 10, background: C.card, border: `2px solid ${C.line}` }}>
          {segs.map(([st, len, id], k) => {
            const shown = Math.max(0, Math.min(len, tick - st));
            return <div key={k} style={{ position: "absolute", left: st * CW, top: 6, height: 48, width: shown * CW, borderRadius: 8, background: PALETTE[id % PALETTE.length], opacity: 0.85 }} />;
          })}
          {!contin && tick > LENS[s] && <div style={{ position: "absolute", left: LENS[s] * CW, top: 6, height: 48, width: (Math.min(tick, longest) - LENS[s]) * CW, borderRadius: 8, background: `repeating-linear-gradient(45deg, ${C.line}, ${C.line} 8px, transparent 8px, transparent 16px)` }} />}
        </Abs>
      ))}
      <Abs x={80} y={680} w={1760} style={{ fontSize: 28, fontWeight: 700, color: contin ? C.green : C.red, opacity: enter(f, start + 40) }}>
        {contin ? "requests get on and off at every step: far higher throughput · standard in vLLM, SGLang, TGI" : "striped = GPU slot idle while the longest request finishes · new requests wait outside"}
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ PagedAttention

export const A12Paged = ({ t }: CP) => {
  const f = t.frame;
  const paged = t.step >= 1;
  const reqs: [number, number, string][] = [
    [7, 20, C.blue],
    [3, 20, C.pink],
    [12, 20, C.green],
  ];
  return (
    <>
      <Abs x={80} y={190} w={1220} style={{ fontSize: 32, fontWeight: 800, ...rise(f, 2) }}>
        GPU memory for the KV cache
      </Abs>
      {!paged &&
        reqs.map(([used, res, col], i) => (
          <Abs key={i} x={80} y={280 + i * 110} w={1760} style={{ display: "flex", gap: 3, opacity: enter(f, 8 + i * 8) }}>
            {Array.from({ length: res }, (_, k) => (
              <div key={k} style={{ width: 80, height: 70, borderRadius: 6, background: k < used ? col : "transparent", border: `2px dashed ${k < used ? col : C.line}` }} />
            ))}
          </Abs>
        ))}
      {!paged && (
        <Abs x={80} y={630} w={1760} style={{ fontSize: 30, fontWeight: 700, color: C.red, opacity: enter(f, 40) }}>
          one big block reserved per request, sized for the longest possible answer · most of it wasted
        </Abs>
      )}
      {paged && (
        <Abs x={80} y={280} w={1760} style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {Array.from({ length: 60 }, (_, k) => {
            const owner = k < 4 ? -1 : k < 11 ? 0 : k < 14 ? 1 : k < 26 ? 2 : k < 40 ? 3 : -2;
            const col = owner === -1 ? C.amber : owner === -2 ? "transparent" : owner === 3 ? C.purple : reqs[owner][2];
            return <div key={k} style={{ width: 100, height: 70, borderRadius: 6, background: col, border: `2px solid ${owner === -2 ? C.line : col}`, opacity: enter(f, at(t, 1) + k), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: C.bg }}>{owner === -1 ? "prefix" : ""}</div>;
          })}
        </Abs>
      )}
      {paged && (
        <Abs x={80} y={650} w={1760} style={{ display: "flex", gap: 20, ...rise(f, at(t, 1) + 40) }}>
          <Chip color={C.green} style={{ fontSize: 28 }}>small pages handed out as needed → many more requests fit</Chip>
          {t.step >= 2 && <Chip color={C.amber} style={{ fontSize: 28 }}>shared system-prompt pages → cheap prefix caching</Chip>}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ MCP

export const A12Mcp = ({ t }: CP) => {
  const f = t.frame;
  const apps = ["support bot", "sales copilot", "coding assistant"];
  const systems = ["CRM", "tickets", "billing"];
  const mcp = t.step >= 1;
  const AX = 300;
  const SX = 1500;
  const Y = (i: number) => 330 + i * 170;
  return (
    <>
      <Svg>
        {!mcp && apps.map((_, i) => systems.map((__, j) => <line key={`${i}${j}`} x1={AX + 150} y1={Y(i) + 40} x2={SX - 150} y2={Y(j) + 40} stroke={C.red} strokeWidth={3} opacity={enter(f, 10 + (i * 3 + j) * 3)} />))}
        {mcp && apps.map((_, i) => <line key={`a${i}`} x1={AX + 150} y1={Y(i) + 40} x2={900} y2={Y(1) + 40} stroke={C.green} strokeWidth={4} opacity={enter(f, at(t, 1) + i * 6)} />)}
        {mcp && systems.map((_, j) => <line key={`s${j}`} x1={1020} y1={Y(1) + 40} x2={SX - 150} y2={Y(j) + 40} stroke={C.green} strokeWidth={4} opacity={enter(f, at(t, 1) + 18 + j * 6)} />)}
      </Svg>
      {apps.map((a, i) => (
        <Abs key={a} x={AX - 150} y={Y(i)} w={300} style={{ ...card(C.blue), padding: "18px 0", textAlign: "center", fontSize: 28, fontWeight: 800, opacity: enter(f, 4 + i * 4) }}>
          {a}
        </Abs>
      ))}
      {systems.map((s, i) => (
        <Abs key={s} x={SX - 150} y={Y(i)} w={300} style={{ ...card(C.purple), padding: "18px 0", textAlign: "center", fontSize: 28, fontWeight: 800, opacity: enter(f, 4 + i * 4) }}>
          {mcp ? `${s} MCP server` : s}
        </Abs>
      ))}
      {mcp && (
        <Abs x={880} y={Y(1) - 10} w={160} style={{ ...card(C.green), padding: "16px 0", textAlign: "center", transform: `scale(${Math.min(1, pop(f, at(t, 1)))})` }}>
          <div style={{ fontSize: 34, fontWeight: 900, color: C.green }}>MCP</div>
          <div style={{ fontSize: 20, color: C.muted }}>one protocol</div>
        </Abs>
      )}
      <Abs x={80} y={200} w={1220} style={{ fontSize: 32, fontWeight: 800, color: mcp ? C.green : C.red }}>
        {mcp ? "N + M = 6 pieces · each app's built-in client speaks MCP" : "N × M = 9 custom integrations, each changed when an API changes"}
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ finale: the whole stack

const STACK: [string, string][] = [
  ["1", "LLM · tokens · attention · prompts"],
  ["2", "RAG · embeddings · chunking"],
  ["3", "HNSW · hybrid · rerank"],
  ["4", "rewrite · corrective RAG · ingestion"],
  ["5", "tools · agent loop · LangGraph"],
  ["6", "checkpoints · idempotency · memory"],
  ["7", "interrupts · approvals · overlays"],
  ["8", "error analysis · judges · metrics"],
  ["9", "trajectories · pass^k · canaries"],
  ["10", "system design · tenants · sagas"],
  ["11", "injection · guardrails · cost"],
  ["12", "fine-tuning · serving · MCP"],
];

export const A12Finale = ({ t }: CP) => {
  const f = t.frame;
  const lit = t.step >= 1 ? Math.min(12, Math.floor(ease(f, at(t, 1), 120) * 12.99)) : 0;
  return (
    <Abs x={80} y={200} w={1760} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
      {STACK.map(([n, s], i) => {
        const on = i < lit;
        const col = PALETTE[i % PALETTE.length];
        return (
          <div key={n} style={{ ...card(on ? col : C.line), padding: "16px 20px", display: "flex", gap: 16, alignItems: "center", opacity: on ? 1 : 0.35, boxShadow: on ? `0 0 26px ${col}44` : undefined, transform: `scale(${on ? lerp(0.96, 1, Math.min(1, pop(f, at(t, 1) + i * 10))) : 0.96})` }}>
            <div style={{ width: 54, height: 54, borderRadius: 99, background: on ? col : C.card2, color: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900, flexShrink: 0 }}>{n}</div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{s}</div>
          </div>
        );
      })}
    </Abs>
  );
};
