// Chapter 10 (Designing LLM systems), told with general examples: a document
// Q&A service for 500 customer companies, and an agent that changes billing.
import { C, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at } from "./custom3.tsx";
import { Arrow, Svg, type CP } from "./secui.tsx";

// ------------------------------------------------------------------ hook

export const A10Hook = ({ t }: CP) => {
  const f = t.frame;
  const left = Math.max(0, 45 - Math.floor(ease(f, 10, 200) * 3));
  const reqs: [string, string][] = [
    ["🏢", "500 customer companies"],
    ["💬", "a million questions a day"],
    ["🔐", "each sees only its own documents"],
    ["⚡", "first words within 2 seconds"],
  ];
  return (
    <>
      <Abs x={80} y={200} w={1100} h={600} style={{ background: "#eef2f8", borderRadius: 16, padding: "30px 40px", boxShadow: "0 18px 50px rgba(0,0,0,0.4)", opacity: enter(f, 2) }}>
        <div style={{ fontSize: 34, fontWeight: 800, color: "#1d2638" }}>Design: “Ask” for every customer</div>
        {reqs.map(([i, s], k) =>
          t.step >= 1 ? (
            <div key={s} style={{ fontSize: 34, color: "#1d2638", marginTop: 22, ...rise(f, at(t, 1) + k * 12) }}>
              {i} {s}
            </div>
          ) : null,
        )}
      </Abs>
      <Abs x={1260} y={260} w={580} style={{ ...card(C.amber), padding: "24px 0", textAlign: "center", ...rise(f, 8) }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>TIME LEFT</div>
        <div style={{ fontFamily: MONO, fontSize: 110, fontWeight: 900, color: C.amber }}>{left}:00</div>
      </Abs>
      {t.step >= 2 && (
        <Abs x={1260} y={560} w={580} style={{ ...card(C.green), padding: "18px 24px", fontSize: 30, fontWeight: 700, ...rise(f, at(t, 2)) }}>
          the shape of an LLM system design interview
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ seven steps

export const A10Steps = ({ t }: CP) => {
  const f = t.frame;
  const steps: [string, string, number][] = [
    ["Clarify", "users, scale, latency, cost of a wrong answer", 0],
    ["Success metric + baseline", "how you'll know; what happens today", 0],
    ["Simplest design first", "call → RAG → workflow → agent", 1],
    ["Components + data flow", "gateway, pipeline, retrieval, orchestration, tools, guardrails, observability", 1],
    ["Eval plan", "golden set, checks, calibrated judge, CI gate, online evals", 2],
    ["Cost + latency budget", "with numbers", 2],
    ["Failures, fallbacks, launch", "each dependency down · deletions · canary", 2],
  ];
  const times = ["~5 min", "~15 min", "~15 min"];
  return (
    <>
      <Abs x={80} y={190} w={1760} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map(([n, d, g], i) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 20, opacity: t.step >= g ? 1 : 0.15, ...rise(f, at(t, g) + i * 6) }}>
            <div style={{ width: 54, height: 54, borderRadius: 99, background: PALETTE[g], color: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ width: 470, fontSize: 31, fontWeight: 800 }}>{n}</div>
            <div style={{ flex: 1, fontSize: 25, color: C.muted }}>{d}</div>
            {(i === 0 || i === 2 || i === 4) && <Chip color={PALETTE[g]} style={{ fontSize: 22 }}>{times[g]}</Chip>}
          </div>
        ))}
      </Abs>
      {t.step >= 3 && (
        <Abs x={80} y={830} w={1760} style={{ ...rise(f, at(t, 3)) }}>
          <Chip color={C.red} style={{ fontSize: 28 }}>
            the three things weaker answers forget: evals · guardrails · fallbacks
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ latency budget

export const A10Budget = ({ t }: CP) => {
  const f = t.frame;
  const parts: [string, number, string][] = [
    ["identity + groups", 50, C.muted],
    ["embed question", 30, C.purple],
    ["hybrid search", 80, C.blue],
    ["rerank", 150, C.cyan],
    ["build prompt", 20, C.muted],
    ["first token", 1000, C.green],
  ];
  const total = 2000;
  let x = 0;
  return (
    <>
      <Abs x={80} y={200} w={1760} style={{ fontSize: 30, fontWeight: 700, ...rise(f, 2) }}>
        target: first words within <span style={{ color: C.amber }}>2,000 ms</span>
      </Abs>
      <Abs x={80} y={290} w={1760} h={90} style={{ borderRadius: 14, border: `3px dashed ${C.amber}`, opacity: enter(f, 6) }} />
      {parts.map(([n, ms, col], i) => {
        const w = (ms / total) * 1752;
        const x0 = x;
        x += w;
        return (
          <Abs key={n} x={84 + x0} y={294} w={Math.max(4, w - 3)} h={82} style={{ background: `${col}88`, border: `2px solid ${col}`, borderRadius: 10, opacity: enter(f, 12 + i * 10) }} />
        );
      })}
      <Abs x={80} y={420} w={1760} style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
        {parts.map(([n, ms, col], i) => (
          <div key={n} style={{ ...card(col), padding: "10px 18px", fontSize: 26, opacity: enter(f, 14 + i * 10) }}>
            <b>{n}</b> <span style={{ fontFamily: MONO, color: col }}>{ms === 1000 ? "600–1,200" : ms} ms</span>
          </div>
        ))}
      </Abs>
      {t.step >= 1 && (
        <Abs x={80} y={580} w={1760} style={{ ...card(C.green), padding: "18px 26px", fontSize: 30, fontWeight: 700, ...rise(f, at(t, 1)) }}>
          then stream the rest · over budget? skip rerank for easy questions, fewer chunks, a faster model, cache frequent questions
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ five workflow patterns

export const A10Patterns = ({ t }: CP) => {
  const f = t.frame;
  const pats: [string, string, string][] = [
    ["Prompt chaining", "A → B → C, code checks between", "🔗"],
    ["Routing", "classify, then send down the right path", "🔀"],
    ["Parallelisation", "split the work, or vote", "⫴"],
    ["Orchestrator-workers", "a model splits the task at run time", "🧑‍✈️"],
    ["Evaluator-optimizer", "draft, critique, revise until it passes", "🔁"],
  ];
  return (
    <>
      <Abs x={80} y={190} w={1220} style={{ fontSize: 30, fontWeight: 700, color: C.muted, ...rise(f, 2) }}>
        Anthropic, “Building effective agents”: five workflow patterns
      </Abs>
      <Abs x={80} y={270} w={1760} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22 }}>
        {pats.map(([n, d, i], k) =>
          t.step >= k ? (
            <div key={n} style={{ ...card(t.step === k ? PALETTE[k] : C.line), padding: "20px 24px", ...rise(f, at(t, k)) }}>
              <div style={{ fontSize: 46 }}>{i}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: PALETTE[k], marginTop: 4 }}>{n}</div>
              <div style={{ fontSize: 25, color: C.muted, marginTop: 6 }}>{d}</div>
            </div>
          ) : (
            <div key={n} />
          ),
        )}
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ the cage

export const A10Cage = ({ t }: CP) => {
  const f = t.frame;
  const bars: [string, string][] = [
    ["⏱️", "step, time and cost limits"],
    ["🧰", "allow-listed tools only"],
    ["🪪", "acts with the user's permissions"],
    ["✋", "approval before risky writes"],
    ["🔎", "verify outcomes, not messages"],
    ["📜", "audit every action"],
  ];
  return (
    <>
      <Abs x={160} y={300} w={560} h={480} style={{ border: `6px solid ${C.amber}`, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", opacity: enter(f, 4) }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 130, transform: `rotate(${Math.sin(f / 20) * 6}deg)` }}>🤖</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>the agent</div>
        </div>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: 30 + i * 80, top: 0, width: 8, height: "100%", background: `${C.amber}66`, transform: `scaleY(${ease(f, 10 + i * 4, 20)})`, transformOrigin: "top" }} />
        ))}
      </Abs>
      <Abs x={820} y={260} w={1020} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {bars.map(([i, s], k) => (
          <div key={s} style={{ ...card(C.amber), padding: "14px 22px", fontSize: 30, fontWeight: 700, opacity: t.step >= (k < 3 ? 0 : 1) ? 1 : 0.15, ...rise(f, (k < 3 ? 10 : at(t, 1)) + (k % 3) * 10) }}>
            {i} {s}
          </div>
        ))}
        {t.step >= 2 && (
          <div style={{ fontSize: 28, color: C.green, fontWeight: 800, ...rise(f, at(t, 2)) }}>all enforced in code · none in the prompt</div>
        )}
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ read/write tools

export const A10Tools = ({ t }: CP) => {
  const f = t.frame;
  const tools: [string, string, string, number][] = [
    ["query_account", "read-only, parameterised queries on allowed views", C.blue, 0],
    ["simulate_change", "what-if on a copy: new invoice, proration", C.purple, 0],
    ["propose_change", "writes a proposal to the staging overlay only", C.amber, 1],
    ["commit_change", "applies an approved proposal; the agent can't call it", C.red, 1],
  ];
  return (
    <>
      <Abs x={80} y={200} w={1760} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        {tools.map(([n, d, col, st]) =>
          t.step >= st ? (
            <div key={n} style={{ ...card(col), padding: "18px 24px", ...rise(f, at(t, st)) }}>
              <div style={{ fontFamily: MONO, fontSize: 32, fontWeight: 800, color: col }}>{n}</div>
              <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>{d}</div>
            </div>
          ) : (
            <div key={n} />
          ),
        )}
      </Abs>
      {t.step >= 2 && (
        <Abs x={80} y={560} w={1760} style={{ ...card(C.green), padding: "18px 26px", display: "flex", gap: 20, alignItems: "center", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 50 }}>🪪</div>
          <div style={{ fontSize: 30, fontWeight: 700 }}>every call carries the support rep's identity and passes the same permission checks as the normal admin screens</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ saga

export const A10Saga = ({ t }: CP) => {
  const f = t.frame;
  const steps: [string, string][] = [
    ["billing: change plan", "undo: restore old plan"],
    ["CRM: update the account", "undo: restore the record"],
    ["email: notify customer", "(no undo: send last)"],
  ];
  const X = (i: number) => 120 + i * 580;
  const failed = t.step >= 2;
  const undo = t.step >= 3 ? ease(f, at(t, 3), 50) : 0;
  return (
    <>
      <Svg>
        {steps.slice(0, -1).map((_, i) => (
          <Arrow key={i} x1={X(i) + 500} y1={330} x2={X(i + 1) - 10} y2={330} color={C.green} p={ease(f, at(t, 1) + i * 20, 16)} />
        ))}
        {t.step >= 3 && <Arrow x1={X(1) + 250} y1={480} x2={X(0) + 250} y2={480} color={C.amber} p={ease(f, at(t, 3) + 20, 20)} dash />}
      </Svg>
      {steps.map(([a, b], i) => {
        const done = t.step >= 1 && (i < 2 || !failed) && ease(f, at(t, 1) + i * 20, 10) > 0.5;
        const isFail = failed && i === 1;
        const undone = undo > 0.6 && i === 0;
        const col = isFail && t.step === 2 ? C.red : undone ? C.amber : done ? C.green : C.line;
        return (
          <Abs key={a} x={X(i)} y={260} w={500} style={{ ...card(col), padding: "18px 24px", ...rise(f, 6 + i * 8) }}>
            <div style={{ fontSize: 30, fontWeight: 800 }}>
              {i + 1}. {a}
            </div>
            <div style={{ fontSize: 25, color: C.amber, marginTop: 8 }}>{b}</div>
            {isFail && t.step >= 2 && <div style={{ fontSize: 26, color: C.red, fontWeight: 800, marginTop: 8 }}>✗ failed for good</div>}
            {undone && <div style={{ fontSize: 26, color: C.amber, fontWeight: 800, marginTop: 8 }}>↩ compensated</div>}
          </Abs>
        );
      })}
      {t.step === 0 && (
        <Abs x={120} y={560} w={1680} style={{ fontSize: 32, fontWeight: 700, ...rise(f, 20) }}>
          two systems, no transaction spans both: a failure halfway leaves data half-changed
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={120} y={620} w={1680} style={{ ...rise(f, at(t, 3) + 30) }}>
          <Chip color={C.green} style={{ fontSize: 28 }}>
            each step idempotent · undo in reverse order · checkpoints record what completed
          </Chip>
        </Abs>
      )}
    </>
  );
};

