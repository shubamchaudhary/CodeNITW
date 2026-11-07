// Chapter 7 (Ask before acting), told with a general example: a pricing
// agent whose price changes must wait for a manager's approval.
import { C, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at } from "./custom3.tsx";
import { Arrow, Svg, type CP } from "./secui.tsx";

const Code = ({ children, size = 24 }: { children: string; size?: number }) => <div style={{ fontFamily: MONO, fontSize: size, whiteSpace: "pre", lineHeight: 1.45 }}>{children}</div>;

const Diff = ({ f, start }: { f: number; start: number }) => (
  <div style={{ ...card(C.amber), padding: "18px 26px", ...rise(f, start) }}>
    <div style={{ fontSize: 24, fontWeight: 800, color: C.amber, letterSpacing: 2 }}>PROPOSED CHANGE</div>
    <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>Wireless Headphones X2 · 6 regions</div>
    <div style={{ fontFamily: MONO, fontSize: 34, marginTop: 6 }}>
      price <span style={{ color: C.red }}>$79</span> → <span style={{ color: C.green }}>$89</span>
    </div>
  </div>
);

// ------------------------------------------------------------------ hook

export const A7Hook = ({ t }: CP) => {
  const f = t.frame;
  const wait = t.step >= 2 ? ease(f, at(t, 2), 60) : 0;
  return (
    <>
      <Abs x={80} y={200} w={900}>
        <Diff f={f} start={6} />
      </Abs>
      {t.step >= 1 && (
        <Abs x={80} y={460} w={900} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {["stop before changing anything", "show the manager exactly what will change", "continue only with their decision"].map((s, i) => (
            <div key={s} style={{ fontSize: 32, fontWeight: 700, ...rise(f, at(t, 1) + i * 12) }}>
              <span style={{ color: C.green }}>✓</span> {s}
            </div>
          ))}
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1080} y={260} w={760} style={{ ...card(C.blue), padding: "22px 28px", textAlign: "center", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>WAITING FOR A DECISION</div>
          <div style={{ fontSize: 90, marginTop: 10 }}>{["🕐", "🕓", "🕖", "🕙", "🌙", "☀️"][Math.min(5, Math.floor(wait * 6))]}</div>
          <div style={{ fontSize: 30, marginTop: 6 }}>minutes, hours, maybe across a deploy</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ pause and resume

export const A7Pause = ({ t }: CP) => {
  const f = t.frame;
  const states: [string, string, string][] = [
    ["Planning", "read-only tools build the diff", C.blue],
    ["Paused", "interrupt(payload) · state saved", C.amber],
    ["Resumed", "Command(resume=decision)", C.green],
    ["Expired", "no answer in time · cleaned up", C.red],
  ];
  return (
    <>
      <Abs x={80} y={230} w={1760} style={{ display: "flex", gap: 22, alignItems: "stretch" }}>
        {states.map(([n, d, col], i) => {
          const st = Math.min(i, 3);
          return (
            <div key={n} style={{ flex: 1, ...card(t.step === st ? col : C.line), padding: "18px 22px", opacity: t.step >= st ? 1 : 0.2, ...rise(f, at(t, st)) }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: col }}>{n}</div>
              <div style={{ fontSize: 25, color: C.muted, marginTop: 6, fontFamily: i === 1 || i === 2 ? MONO : undefined }}>{d}</div>
            </div>
          );
        })}
      </Abs>
      {t.step >= 1 && (
        <Abs x={80} y={460} w={1000} style={{ ...card(C.amber), padding: "18px 24px", ...rise(f, at(t, 1) + 16) }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>WHAT A PAUSED RUN IS</div>
          <div style={{ fontFamily: MONO, fontSize: 24, marginTop: 10, lineHeight: 1.5 }}>
            checkpoints · thread_id = "price-x2" · step = review
            <br />
            pending interrupt: {"{diff: …}"}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 10 }}>just rows in a database · no thread, connection or process waits</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1140} y={460} w={700} style={{ ...card(C.green), padding: "18px 24px", ...rise(f, at(t, 2) + 10) }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>any server, any time later:</div>
          <Code size={23}>{'graph.invoke(\n  Command(resume={"type": "approve"}),\n  config={"configurable":\n          {"thread_id": "price-x2"}})'}</Code>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={800} w={1760} style={{ ...rise(f, at(t, 3) + 10) }}>
          <Chip color={C.red} style={{ fontSize: 28 }}>
            needs a durable checkpointer: in-memory, a restart silently loses every paused proposal
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the step starts over

export const A7Replay = ({ t }: CP) => {
  const f = t.frame;
  const lines = ["def propose(state):", "    diff = build_diff(state)", "    db.insert_proposal(diff)      # side effect", "    decision = interrupt({\"diff\": diff})", "    return {\"decision\": decision}"];
  const cur = t.step === 0 ? Math.min(3, Math.floor(Math.max(0, f - 20) / 18)) : t.step === 1 ? Math.min(4, Math.floor(Math.max(0, f - at(t, 1) - 10) / 18)) : 4;
  const rows = t.step === 0 ? (cur >= 2 ? 1 : 0) : t.step === 1 ? (cur >= 2 ? 2 : 1) : 2;
  return (
    <>
      <Abs x={80} y={200} w={1100} style={{ ...card(), background: "#0a0e16", padding: "18px 0", ...rise(f, 4) }}>
        {lines.map((l, i) => (
          <div key={i} style={{ fontFamily: MONO, fontSize: 27, padding: "6px 24px", whiteSpace: "pre", background: i === cur && t.step < 2 ? `${t.step === 1 ? C.amber : C.blue}33` : "transparent", color: i === 2 ? C.amber : C.text }}>
            {l}
          </div>
        ))}
      </Abs>
      <Abs x={1240} y={200} w={600} style={{ ...card(t.step >= 1 ? C.red : C.line), padding: "18px 24px", ...rise(f, 8) }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>PROPOSALS TABLE</div>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} style={{ fontFamily: MONO, fontSize: 25, marginTop: 10, color: i === 1 ? C.red : C.text, ...rise(f, i === 1 ? at(t, 1) + 46 : 56) }}>
            row {i + 1}: X2 $79 → $89
          </div>
        ))}
      </Abs>
      <Abs x={80} y={520} w={1100} style={{ fontSize: 30, fontWeight: 800, color: t.step === 0 ? C.blue : C.amber }}>
        {t.step === 0 ? "first run: pauses at interrupt()" : "on resume: the step runs again from line 1; interrupt() returns the saved answer"}
      </Abs>
      {t.step >= 2 && (
        <Abs x={80} y={640} w={1760} style={{ display: "flex", gap: 24, ...rise(f, at(t, 2)) }}>
          <div style={{ flex: 1, ...card(C.green), padding: "16px 22px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.green, letterSpacing: 2 }}>FIX · STEP 1: STAGE</div>
            <Code size={23}>{"def stage(state):\n    db.insert_proposal(diff,\n        key=state[\"proposal_id\"])  # idempotent"}</Code>
          </div>
          <div style={{ flex: 1, ...card(C.green), padding: "16px 22px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.green, letterSpacing: 2 }}>STEP 2: REVIEW</div>
            <Code size={23}>{"def review(state):\n    decision = interrupt({\"diff\": …})\n    return {\"decision\": decision}"}</Code>
          </div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ middleware decisions

export const A7Decisions = ({ t }: CP) => {
  const f = t.frame;
  const opts: [string, string, string][] = [
    ["approve", "run as proposed", C.green],
    ["edit", "run with changed arguments", C.blue],
    ["reject", "skip it; tell the model why", C.red],
    ["respond", "reply as the tool's result, without running", C.purple],
  ];
  return (
    <>
      <Abs x={80} y={200} w={1100} style={{ ...card(), padding: "18px 24px", ...rise(f, 4) }}>
        <Code size={24}>{'agent = create_agent(model, tools=[update_price, ...],\n  middleware=[HumanInTheLoopMiddleware(\n    interrupt_on={"update_price": True})])'}</Code>
      </Abs>
      <Abs x={80} y={400} w={1760} style={{ display: "flex", gap: 20 }}>
        {opts.map(([n, d, col], i) => (
          <div key={n} style={{ flex: 1, ...card(col), padding: "18px 22px", opacity: t.step >= 1 ? 1 : 0.2, ...rise(f, at(t, 1) + i * 10) }}>
            <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 800, color: col }}>{n}</div>
            <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>{d}</div>
          </div>
        ))}
      </Abs>
      {t.step >= 2 && (
        <Abs x={80} y={620} w={1760} style={{ ...card(C.red), padding: "18px 26px", fontSize: 30, fontWeight: 700, ...rise(f, at(t, 2)) }}>
          ✗ don't refuse with <span style={{ fontFamily: MONO, color: C.purple }}>respond</span>: the model treats it as success. Use <span style={{ fontFamily: MONO, color: C.red }}>reject</span> with a reason.
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ what needs a human

export const A7Matrix = ({ t }: CP) => {
  const f = t.frame;
  const X = 260;
  const Y = 250;
  const W = 1000;
  const H = 560;
  const cells: [number, number, string, string, string, number][] = [
    [0, 1, "Automatic", "read stock, search docs", C.green, 0],
    [1, 1, "Automatic + audit", "price ±2%, a draft email", C.blue, 1],
    [0, 0, "Approval", "price change > 5%, a refund > $200", C.amber, 2],
    [1, 0, "Never", "delete a product line, bulk-email customers", C.red, 3],
  ];
  return (
    <>
      <Svg>
        <line x1={X} y1={Y + H} x2={X + W} y2={Y + H} stroke={C.line} strokeWidth={3} opacity={enter(f, 4)} />
        <line x1={X} y1={Y} x2={X} y2={Y + H} stroke={C.line} strokeWidth={3} opacity={enter(f, 4)} />
      </Svg>
      <Abs x={X} y={Y + H + 14} w={W} style={{ textAlign: "center", fontSize: 26, color: C.muted, fontWeight: 700 }}>
        damage if wrong →
      </Abs>
      <Abs x={X - 220} y={Y + H / 2 - 40} w={200} style={{ textAlign: "right", fontSize: 26, color: C.muted, fontWeight: 700 }}>
        easy to undo ↑
      </Abs>
      {cells.map(([cx, cy, name, ex, col, st]) => {
        if (t.step < st) return null;
        return (
          <Abs key={name} x={X + 20 + cx * (W / 2)} y={Y + 20 + (1 - cy) * (H / 2)} w={W / 2 - 40} h={H / 2 - 40} style={{ ...card(col), padding: "20px 24px", ...rise(f, at(t, st)) }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: col }}>{name}</div>
            <div style={{ fontSize: 27, color: C.muted, marginTop: 8 }}>{ex}</div>
          </Abs>
        );
      })}
      {t.step >= 4 && (
        <Abs x={1340} y={300} w={500} style={{ ...card(C.purple), padding: "20px 24px", fontSize: 29, lineHeight: 1.4, ...rise(f, at(t, 4)) }}>
          thresholds live in <b>code</b>, not in the prompt: a prompt can be ignored, a check can't
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the review card

export const A7Card = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      <Abs x={80} y={230} w={560} style={{ ...card(C.red), padding: "26px 28px", textAlign: "center", ...rise(f, 4) }}>
        <div style={{ fontSize: 34, fontWeight: 800 }}>Approve action #42?</div>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 20 }}>
          <Chip color={C.green}>Approve</Chip>
          <Chip color={C.red}>Reject</Chip>
        </div>
        <div style={{ fontSize: 26, color: C.red, marginTop: 18, fontWeight: 700 }}>approved in 2 seconds, unread</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={720} y={230} w={1120} style={{ ...card(C.green), padding: "22px 28px", display: "flex", flexDirection: "column", gap: 14, ...rise(f, at(t, 1)) }}>
          {[
            ["THE DIFF", "Wireless Headphones X2 · 6 regions · $79 → $89 (+12.7%)", C.amber],
            ["WHY", "competitor prices up 15%; demand steady; margin target", C.blue],
            ["RISK FLAGS", "above the usual 5% step · competitor data is 3 days old", C.red],
            ["OPTIONS", "approve · edit the price · reject with a reason", C.green],
          ].map(([a, b, col], i) => (
            <div key={a} style={{ opacity: t.step >= [1, 2, 2, 3][i] ? 1 : 0.25, ...rise(f, at(t, 1) + i * 10) }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: col, letterSpacing: 2 }}>{a}</div>
              <div style={{ fontSize: 29, marginTop: 2 }}>{b}</div>
            </div>
          ))}
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={720} w={1760} style={{ display: "flex", gap: 16, ...rise(f, at(t, 3)) }}>
          {["approval rate", "time to decide", "edit rate", "approved changes later reverted"].map((s, i) => (
            <Chip key={s} color={PALETTE[i]} style={{ fontSize: 26 }}>
              📈 {s}
            </Chip>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ base and overlay

export const A7Overlay = ({ t }: CP) => {
  const f = t.frame;
  const regions = ["US", "UK", "DE", "FR", "IN", "JP"];
  const applied = t.step >= 2 ? ease(f, at(t, 2) + 10, 30) : 0;
  return (
    <>
      <Abs x={80} y={220} w={760} style={{ ...card(C.blue), padding: "18px 24px", ...rise(f, 4) }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.blue, letterSpacing: 2 }}>BASE · LIVE PRICES (STORE READS THIS)</div>
        {regions.map((r) => (
          <div key={r} style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 27, marginTop: 8 }}>
            <span>X2 · {r}</span>
            <span style={{ color: applied > 0.5 ? C.green : C.text }}>{applied > 0.5 ? "$89" : "$79"}</span>
          </div>
        ))}
      </Abs>
      {t.step >= 1 && t.step < 3 && (
        <Abs x={1080} y={220} w={760} style={{ ...card(C.amber), padding: "18px 24px", opacity: 1 - applied * 0.6, ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.amber, letterSpacing: 2 }}>OVERLAY · PROPOSED (STAGING, EXPIRES)</div>
          {regions.map((r) => (
            <div key={r} style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 27, marginTop: 8 }}>
              <span>X2 · {r}</span>
              <span style={{ color: C.amber }}>$89</span>
            </div>
          ))}
        </Abs>
      )}
      {t.step >= 1 && (
        <Svg>
          <Arrow x1={1074} y1={470} x2={846} y2={470} color={C.green} p={applied} />
        </Svg>
      )}
      {t.step >= 2 && (
        <Abs x={860} y={500} w={200} style={{ textAlign: "center", fontSize: 24, color: C.green, fontWeight: 800, ...rise(f, at(t, 2)) }}>
          approve: one transaction
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={1080} y={220} w={760} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            ["edit", "the manager's values replace the proposal, then the same commit", C.blue],
            ["reject / expire", "overlay deleted; the reason goes back to the agent", C.red],
            ["after commit", "read the base back; report success only if it's really there", C.green],
          ].map(([a, b, col], i) => (
            <div key={a} style={{ ...card(col), padding: "14px 20px", ...rise(f, at(t, 3) + i * 12) }}>
              <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: col }}>{a}</div>
              <div style={{ fontSize: 25, color: C.muted, marginTop: 4 }}>{b}</div>
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ optimistic concurrency

export const A7Cas = ({ t }: CP) => {
  const f = t.frame;
  const v = t.step >= 1 ? 8 : 7;
  return (
    <>
      <Abs x={80} y={220} w={720} style={{ ...card(), padding: "20px 26px", ...rise(f, 4) }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>ROW · prices / x2-us</div>
        <div style={{ fontFamily: MONO, fontSize: 32, marginTop: 10 }}>
          price: {t.step >= 1 ? <span style={{ color: C.purple }}>$84</span> : "$79"}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 32 }}>
          version: <span style={{ color: t.step >= 1 ? C.purple : C.text }}>{v}</span>
        </div>
      </Abs>
      <Abs x={880} y={220} w={960} style={{ ...card(C.amber), padding: "20px 26px", ...rise(f, 10) }}>
        <div style={{ fontSize: 28, fontWeight: 700 }}>the proposal recorded what it saw: <span style={{ fontFamily: MONO, color: C.amber }}>version 7</span></div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={880} y={340} w={960} style={{ ...card(C.purple), padding: "16px 24px", fontSize: 28, ...rise(f, at(t, 1)) }}>
          meanwhile, a colleague sets $84 → version 8
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={80} y={480} w={1760} style={{ ...card(C.red), padding: "18px 26px", ...rise(f, at(t, 2)) }}>
          <Code size={27}>{"UPDATE prices SET price = 89, version = version + 1\nWHERE id = 'x2-us' AND version = 7;"}</Code>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.red, marginTop: 10, opacity: enter(f, at(t, 2) + 30) }}>→ 0 rows updated: abort, rebuild the proposal on fresh data</div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={740} w={1760} style={{ display: "flex", gap: 20, ...rise(f, at(t, 3)) }}>
          <div style={{ flex: 1, ...card(C.red), padding: "14px 22px", fontSize: 27 }}>
            <b>pessimistic lock</b>: hold the row for hours while someone decides ✗
          </div>
          <div style={{ flex: 1, ...card(C.green), padding: "14px 22px", fontSize: 27 }}>
            <b>optimistic</b>: no lock; check the version at commit ✓
          </div>
        </Abs>
      )}
    </>
  );
};

