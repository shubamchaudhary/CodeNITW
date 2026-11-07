// Chapter 9 (Testing agents and shipping safely), told with a general example:
// a store's refund agent, tested by outcome and path, then rolled out.
import { C, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at } from "./custom3.tsx";
import { type CP } from "./secui.tsx";

// ------------------------------------------------------------------ hook

export const A9Hook = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      <Abs x={80} y={200} w={1000} style={{ ...card(), background: C.bg2, padding: "24px 30px", display: "flex", flexDirection: "column", gap: 14, opacity: enter(f, 2) }}>
        <div style={{ alignSelf: "flex-end", background: C.blue, color: "#06101f", borderRadius: 22, padding: "12px 22px", fontSize: 30, fontWeight: 600 }}>Refund my order 48213, it arrived broken.</div>
        <div style={{ alignSelf: "flex-start", background: C.card2, borderRadius: 22, padding: "12px 22px", fontSize: 30, color: C.green, fontWeight: 700, transform: `scale(${Math.min(1, pop(f, 20))})` }}>✅ Done! Refund issued for order 48213.</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={1140} y={200} w={700} style={{ ...card(C.red), padding: "20px 26px", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>PAYMENTS DATABASE</div>
          <div style={{ fontFamily: MONO, fontSize: 30, marginTop: 10 }}>
            refund · order <span style={{ color: C.red }}>48231</span> · $40
          </div>
          <div style={{ fontSize: 28, color: C.red, fontWeight: 800, marginTop: 8 }}>the wrong order</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={80} y={560} w={1760} style={{ ...card(C.amber), padding: "20px 28px", display: "flex", gap: 24, alignItems: "center", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 60 }}>📅</div>
          <div>
            <div style={{ fontSize: 34, fontWeight: 800 }}>Tuesday: answers suddenly longer, a few new refusals</div>
            <div style={{ fontSize: 28, color: C.muted }}>nobody deployed anything</div>
          </div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ three levels

export const A9Levels = ({ t }: CP) => {
  const f = t.frame;
  const calls: [string, boolean][] = [
    ["get_order(48213)", true],
    ["check_policy(\"damaged\")", true],
    ["request_approval(…)", true],
    ["issue_refund(48213, $40)", true],
  ];
  return (
    <>
      <Abs x={80} y={250} w={540} style={{ ...card(t.step === 0 ? C.green : C.line), padding: "20px 24px", ...rise(f, 4) }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: C.green }}>1 · Final outcome</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>query the system of record:</div>
        <div style={{ fontFamily: MONO, fontSize: 24, marginTop: 8 }}>one $40 refund on 48213, none on any other order</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={660} y={250} w={620} style={{ ...card(t.step === 1 ? C.blue : C.line), padding: "20px 24px", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.blue }}>2 · Trajectory</div>
          {calls.map(([c, ok], i) => (
            <div key={c} style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 24, marginTop: 8, opacity: enter(f, at(t, 1) + 10 + i * 8) }}>
              <span>{i + 1}. {c}</span>
              <span style={{ color: ok ? C.green : C.red }}>✓</span>
            </div>
          ))}
          <div style={{ fontSize: 24, color: C.muted, marginTop: 10 }}>rules: read before write · approval before refund · ≤ 12 steps · never delete</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1320} y={250} w={520} style={{ ...card(t.step === 2 ? C.purple : C.line), padding: "20px 24px", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.purple }}>3 · Single step</div>
          <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>given this exact state, is the next call right?</div>
          <div style={{ fontSize: 24, marginTop: 8 }}>finds where a run goes wrong</div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={680} w={1760} style={{ ...rise(f, at(t, 3)) }}>
          <Chip color={C.amber} style={{ fontSize: 28 }}>
            every run in a fresh sandbox: a seeded test database + fake external services
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ test pyramid

export const A9Pyramid = ({ t }: CP) => {
  const f = t.frame;
  const tiers: [string, string, string, number][] = [
    ["Human review, end to end", "a weekly sample of full conversations", C.purple, 2],
    ["Trajectory tests", "whole runs in a sandbox: outcome + path rules", C.blue, 1],
    ["Component tests", "each tool, prompt, parser: fast and many", C.green, 0],
  ];
  return (
    <>
      {tiers.map(([n, d, col, st], i) => {
        const w = 700 + i * 380;
        return (
          <Abs key={n} x={960 - w / 2} y={250 + i * 190} w={w} style={{ ...card(t.step === st ? col : C.line), padding: "22px 26px", textAlign: "center", opacity: t.step >= st ? 1 : 0.2, ...rise(f, at(t, st)) }}>
            <div style={{ fontSize: 34, fontWeight: 800, color: col }}>{n}</div>
            <div style={{ fontSize: 26, color: C.muted, marginTop: 4 }}>{d}</div>
          </Abs>
        );
      })}
    </>
  );
};

// ------------------------------------------------------------------ pass@k vs pass^k

export const A9PassK = ({ t }: CP) => {
  const f = t.frame;
  const runs = Array.from({ length: 10 }, (_, i) => i !== 3 && i !== 7);
  const ks = [1, 2, 3, 5, 8];
  return (
    <>
      <Abs x={80} y={200} w={1220} style={{ ...rise(f, 2) }}>
        <div style={{ fontSize: 30, fontWeight: 700 }}>the same task, run 10 times</div>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          {runs.map((ok, i) => (
            <div key={i} style={{ width: 90, height: 90, borderRadius: 16, background: ok ? `${C.green}44` : `${C.red}44`, border: `3px solid ${ok ? C.green : C.red}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, opacity: enter(f, 8 + i * 5) }}>
              {ok ? "✓" : "✗"}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: C.amber, marginTop: 12, opacity: enter(f, 60) }}>80% per attempt</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={80} y={480} w={820} style={{ ...card(C.blue), padding: "18px 24px", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.blue }}>pass@k: at least one of k succeeds</div>
          <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>a person picks the best attempt: code suggestions</div>
          <div style={{ fontFamily: MONO, fontSize: 30, marginTop: 8 }}>pass@3 = 1 − 0.2³ = 0.99</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={960} y={480} w={880} style={{ ...card(C.red), padding: "18px 24px", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.red }}>pass^k: all k succeed</div>
          <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>each real request gets one attempt: customers, data changes</div>
          <div style={{ fontFamily: MONO, fontSize: 30, marginTop: 8 }}>pass^3 = 0.8³ = 0.51</div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={720} w={1760} style={{ display: "flex", gap: 14, alignItems: "flex-end", ...rise(f, at(t, 3)) }}>
          {ks.map((k, i) => {
            const v = Math.pow(0.8, k);
            return (
              <div key={k} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800 }}>{Math.round(v * 100)}%</div>
                <div style={{ height: 120 * v * ease(f, at(t, 3) + i * 6, 20), background: C.red, borderRadius: 8, marginTop: 6 }} />
                <div style={{ fontFamily: MONO, fontSize: 22, color: C.muted, marginTop: 4 }}>pass^{k}</div>
              </div>
            );
          })}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ trace waterfall

export const A9Trace = ({ t }: CP) => {
  const f = t.frame;
  const spans: [string, number, number, number, string, string][] = [
    ["request · refund agent", 0, 0, 100, C.muted, "4.2 s · $0.011"],
    ["model call · claude-sonnet-4-5-20250929 · prompt v14", 1, 0, 22, C.purple, "1,840 in · 96 out"],
    ["tool · get_order(48213)", 1, 23, 8, C.green, "120 ms"],
    ["tool · search_policy(\"damaged\")", 1, 32, 12, C.green, "5 chunks · ids, scores"],
    ["model call · prompt v14", 1, 45, 30, C.purple, "2,610 in · 140 out"],
    ["tool · issue_refund(48213, 40)", 1, 76, 14, C.amber, "ok · idem key"],
    ["model call · final answer", 1, 91, 9, C.purple, "TTFT 0.6 s"],
  ];
  const X = 520;
  const W = 900;
  return (
    <>
      <Abs x={80} y={190} w={1220} style={{ fontSize: 26, fontWeight: 800, color: C.muted, letterSpacing: 2, ...rise(f, 2) }}>
        ONE TRACE · NESTED SPANS
      </Abs>
      {spans.map(([n, depth, start, len, col, meta], i) => (
        <Abs key={i} x={80} y={250 + i * 74} w={1760} style={{ display: "flex", alignItems: "center", opacity: enter(f, 6 + i * 6) }}>
          <div style={{ width: 430, paddingLeft: depth * 26, fontSize: 21, fontFamily: MONO, color: col, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n}</div>
          <div style={{ position: "relative", width: W, height: 40, marginLeft: X - 80 - 430 + 10 }}>
            <div style={{ position: "absolute", left: (start / 100) * W, width: Math.max(6, (len / 100) * W * ease(f, 8 + i * 6, 20)), height: 40, borderRadius: 8, background: `${col}88`, border: `2px solid ${col}` }} />
          </div>
          {t.step >= 1 && <div style={{ fontFamily: MONO, fontSize: 21, color: C.muted, marginLeft: 20, ...rise(f, at(t, 1) + i * 5) }}>{meta}</div>}
        </Abs>
      ))}
      {t.step >= 2 && (
        <Abs x={80} y={790} w={1760} style={{ ...rise(f, at(t, 2)) }}>
          <Chip color={C.blue} style={{ fontSize: 26 }}>
            + who asked · config version · user feedback later · personal data masked · OpenTelemetry conventions
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ rollout dial

export const A9Rollout = ({ t }: CP) => {
  const f = t.frame;
  const stages: [string, string, string][] = [
    ["🧪", "Offline", "golden set must pass"],
    ["👻", "Shadow", "runs on real traffic; users see the old answers"],
    ["🐤", "Canary 5%", "success metric + rollback triggers written first"],
    ["📈", "25% → 100%", "then online evals"],
  ];
  const lit = Math.min(3, t.step);
  return (
    <>
      <Abs x={80} y={250} w={1760} style={{ display: "flex", gap: 20 }}>
        {stages.map(([i, n, d], k) => (
          <div key={n} style={{ flex: 1, ...card(k <= lit ? [C.blue, C.purple, C.amber, C.green][k] : C.line), padding: "20px 22px", opacity: k <= lit ? 1 : 0.2, ...rise(f, at(t, k)) }}>
            <div style={{ fontSize: 54 }}>{i}</div>
            <div style={{ fontSize: 34, fontWeight: 800, marginTop: 4 }}>{n}</div>
            <div style={{ fontSize: 25, color: C.muted, marginTop: 6 }}>{d}</div>
          </div>
        ))}
      </Abs>
      <Abs x={80} y={560} w={1760} style={{ height: 30, borderRadius: 15, background: C.card, border: `2px solid ${C.line}` }}>
        <div style={{ height: "100%", width: `${[3, 8, 20, 100][lit] * ease(f, at(t, lit), 30) + (lit ? [3, 8, 20, 100][lit - 1] * (1 - ease(f, at(t, lit), 30)) : 0)}%`, borderRadius: 15, background: `linear-gradient(90deg, ${C.blue}, ${C.green})` }} />
      </Abs>
      {t.step >= 4 && (
        <Abs x={80} y={640} w={1760} style={{ ...card(C.red), padding: "18px 26px", display: "flex", gap: 20, alignItems: "center", ...rise(f, at(t, 4)) }}>
          <div style={{ fontSize: 50 }}>⏪</div>
          <div style={{ fontSize: 30, fontWeight: 700 }}>thumbs-down or escalations cross the trigger → roll back: a config switch, seconds, not a redeploy</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ config version

export const A9Config = ({ t }: CP) => {
  const f = t.frame;
  const parts: [string, string][] = [
    ["prompt", "v14"],
    ["model", "pinned dated snapshot"],
    ["reranker", "on"],
    ["index", "v7"],
    ["tools", "v3"],
  ];
  const join = t.step >= 1 ? ease(f, at(t, 1), 30) : 0;
  return (
    <>
      {parts.map(([k, v], i) => {
        const x0 = 80 + i * 352;
        const y0 = 280;
        const x1 = 560 + i * 4;
        const y1 = 520;
        return (
          <Abs key={k} x={lerp(x0, x1, join)} y={lerp(y0, y1, join)} w={320} style={{ ...card(PALETTE[i]), padding: "16px 20px", opacity: (1 - join * 0.85) * enter(f, 6 + i * 6) }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: PALETTE[i] }}>{k}</div>
            <div style={{ fontFamily: MONO, fontSize: 26 }}>{v}</div>
          </Abs>
        );
      })}
      {t.step >= 1 && (
        <Abs x={460} y={500} w={1000} style={{ ...card(C.green), padding: "24px 30px", textAlign: "center", ...rise(f, at(t, 1) + 24) }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>ONE CONFIGURATION VERSION, ON EVERY TRACE</div>
          <div style={{ fontFamily: MONO, fontSize: 44, fontWeight: 800, color: C.green, marginTop: 8 }}>refund-agent@2026-11-03.2</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={80} y={760} w={1760} style={{ textAlign: "center", ...rise(f, at(t, 2)) }}>
          <Chip color={C.amber} style={{ fontSize: 28 }}>
            every score, experiment and incident maps to an exact config · rollback = switch to an earlier one
          </Chip>
        </Abs>
      )}
    </>
  );
};

