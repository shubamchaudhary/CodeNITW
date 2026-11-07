// Chapter 5 (From assistant to agent), told with a general example: an
// airline support agent that looks things up and acts through tools.
import { C, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at } from "./custom3.tsx";
import { Arrow, Svg, type CP } from "./secui.tsx";

const Code = ({ children, size = 26, col }: { children: string; size?: number; col?: string }) => (
  <div style={{ fontFamily: MONO, fontSize: size, whiteSpace: "pre", lineHeight: 1.4, color: col ?? C.text }}>{children}</div>
);

// ------------------------------------------------------------------ hook

export const A5Hook = ({ t }: CP) => {
  const f = t.frame;
  const needs: [string, string, string][] = [
    ["✈️", "flight status", "live, in the operations system"],
    ["🎫", "the booking", "in the reservations database"],
    ["🔁", "rebook the seat", "an action, not an answer"],
  ];
  return (
    <>
      <Abs x={80} y={180} w={1160} style={{ ...card(), background: C.bg2, padding: "24px 30px", display: "flex", flexDirection: "column", gap: 16, opacity: enter(f, 2) }}>
        <div style={{ alignSelf: "flex-end", maxWidth: 900, background: C.blue, color: "#06101f", borderRadius: 22, padding: "14px 24px", fontSize: 31, fontWeight: 600, transform: `scale(${Math.min(1, pop(f, 6))})` }}>My flight AB123 was cancelled. Rebook me on the next one. Do I get compensation?</div>
        {t.step >= 1 && (
          <div style={{ alignSelf: "flex-start", maxWidth: 900, background: C.card2, borderRadius: 22, padding: "14px 24px", fontSize: 30, color: C.amber, ...rise(f, at(t, 1)) }}>
            I can only answer from documents. Here is our rebooking policy…
          </div>
        )}
      </Abs>
      {t.step >= 2 && (
        <Abs x={80} y={560} w={1760} style={{ display: "flex", gap: 24 }}>
          {needs.map(([i, a, b], k) => (
            <div key={a} style={{ flex: 1, ...card(k === 2 ? C.green : C.blue), padding: "20px 26px", ...rise(f, at(t, 2) + k * 12) }}>
              <div style={{ fontSize: 50 }}>{i}</div>
              <div style={{ fontSize: 34, fontWeight: 800, marginTop: 6 }}>{a}</div>
              <div style={{ fontSize: 26, color: C.muted, marginTop: 4 }}>{b}</div>
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the order slip

export const A5Slip = ({ t }: CP) => {
  const f = t.frame;
  const lanes: [string, string, string][] = [
    ["🧑", "Customer", "writes an order slip"],
    ["🧑‍🍳", "Waiter", "checks it: “we're out of fish”"],
    ["🍳", "Kitchen", "cooks"],
  ];
  const map: [string, string, string][] = [
    ["🧠", "Model", "writes a tool call: name + arguments"],
    ["🛡️", "Your code", "validates: allowed? arguments sane?"],
    ["⚙️", "Your code", "runs the real function, returns the result"],
  ];
  return (
    <>
      <Abs x={80} y={270} w={1760} style={{ display: "flex", gap: 30 }}>
        {lanes.map(([i, a, b], k) => (
          <div key={a} style={{ flex: 1, ...card(), padding: "20px 26px", textAlign: "center", ...rise(f, 6 + k * 10) }}>
            <div style={{ fontSize: 56 }}>{i}</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{a}</div>
            <div style={{ fontSize: 26, color: C.muted }}>{b}</div>
          </div>
        ))}
      </Abs>
      {t.step >= 1 && (
        <Abs x={80} y={530} w={1760} style={{ display: "flex", gap: 30 }}>
          {map.map(([i, a, b], k) => (
            <div key={k} style={{ flex: 1, ...card(k === 0 ? C.purple : C.green), padding: "20px 26px", textAlign: "center", ...rise(f, at(t, 1) + k * 12) }}>
              <div style={{ fontSize: 56 }}>{i}</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{a}</div>
              <div style={{ fontSize: 26, color: C.muted }}>{b}</div>
            </div>
          ))}
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={80} y={800} w={1760} style={{ textAlign: "center", ...rise(f, at(t, 2)) }}>
          <Chip color={C.amber} style={{ fontSize: 34, padding: "12px 30px" }}>
            the model never touches your systems: it only asks
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ tool definition

export const A5ToolCard = ({ t }: CP) => {
  const f = t.frame;
  const part = (i: number, label: string, col: string, body: string) => (
    <div style={{ ...card(t.step === i ? col : C.line), padding: "14px 22px", opacity: t.step >= i ? 1 : 0.2, ...rise(f, at(t, i)) }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: col, letterSpacing: 2 }}>{label}</div>
      <Code size={26}>{body}</Code>
    </div>
  );
  return (
    <>
      <Abs x={80} y={190} w={1100} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {part(0, "NAME", C.blue, "get_flight_status")}
        {part(1, "DESCRIPTION · A PROMPT", C.green, "Live status of one flight by flight number,\nlike AB123: departure, delay, gate, cancelled.\nUse for any question about a flight today.")}
        {part(2, "ARGUMENTS · JSON SCHEMA", C.purple, '{ "flight_no": { "type": "string",\n                "pattern": "^[A-Z]{2}[0-9]{1,4}$" } }')}
      </Abs>
      {t.step >= 3 && (
        <Abs x={1240} y={300} w={600} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...card(C.red), padding: "16px 22px", ...rise(f, at(t, 3)) }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.red }}>✗ vague</div>
            <Code size={24}>{'"flights api"'}</Code>
          </div>
          <div style={{ ...card(C.green), padding: "16px 22px", ...rise(f, at(t, 3) + 14) }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.green }}>✓ says what and when</div>
            <div style={{ fontSize: 24, marginTop: 4 }}>the description above</div>
          </div>
          <div style={{ fontSize: 26, color: C.muted, fontWeight: 700, ...rise(f, at(t, 3) + 28) }}>every tool's definition is sent with every request: tokens, and confusion</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ errors and retries

export const A5Errors = ({ t }: CP) => {
  const f = t.frame;
  const rows: [string, string, string][] = [
    ["timeout", "return “error: flight service timed out” as the tool result", C.amber],
    ["429 / 503", "retry with exponential backoff + jitter", C.blue],
    ["400 bad arguments", "return the message; the model fixes its call", C.purple],
    ["403 not allowed", "never retry; tell the user", C.red],
  ];
  const waits = [1, 2, 4, 8];
  return (
    <>
      <Abs x={80} y={190} w={1220} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {rows.map(([e, a, col], i) => {
          const st = Math.min(i, 3);
          if (t.step < st) return null;
          return (
            <div key={e} style={{ ...card(t.step === st ? col : C.line), padding: "14px 22px", display: "flex", gap: 24, alignItems: "center", ...rise(f, at(t, st) + (i === 3 ? 14 : 0)) }}>
              <div style={{ width: 340, fontFamily: MONO, fontSize: 28, fontWeight: 800, color: col }}>{e}</div>
              <div style={{ fontSize: 28 }}>{a}</div>
            </div>
          );
        })}
      </Abs>
      {t.step === 1 || t.step === 2 ? (
        <Abs x={80} y={640} w={1760} style={{ opacity: enter(f, at(t, 1)) }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>RETRY TIMELINE · WAITS DOUBLE, PLUS A LITTLE RANDOMNESS</div>
          <div style={{ position: "relative", height: 120, marginTop: 14 }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 58, height: 4, background: C.line }} />
            {waits.map((w, i) => {
              const x = (waits.slice(0, i + 1).reduce((a, b) => a + b, 0) / 15) * 1600;
              return (
                <div key={i} style={{ position: "absolute", left: x, top: 30, textAlign: "center", width: 120, marginLeft: -60, opacity: enter(f, at(t, 1) + 10 + i * 10) }}>
                  <div style={{ width: 22, height: 22, borderRadius: 99, background: C.blue, margin: "0 auto" }} />
                  <div style={{ fontFamily: MONO, fontSize: 24, marginTop: 16 }}>+{w}s ±</div>
                </div>
              );
            })}
          </div>
        </Abs>
      ) : null}
    </>
  );
};

// ------------------------------------------------------------------ structured output

export const A5Structured = ({ t }: CP) => {
  const f = t.frame;
  const ladder: [string, string][] = [
    ["ask for JSON in the prompt", "chatter, broken syntax"],
    ["JSON mode", "valid JSON, any fields"],
    ["your schema as a “tool”", "model fills your fields"],
    ["strict schema", "only output that fits"],
  ];
  return (
    <>
      {ladder.map(([a, b], i) => {
        if (t.step < 1 && i > 0) return null;
        const p = Math.min(1, pop(f, i === 0 ? 6 : at(t, 1) + (i - 1) * 12));
        return (
          <Abs key={a} x={80 + i * 50} y={730 - i * 130} w={680} style={{ ...card(i === 3 ? C.green : C.line), padding: "14px 22px", opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
            <div style={{ fontSize: 29, fontWeight: 800 }}>
              {i + 1}. {a}
            </div>
            <div style={{ fontSize: 24, color: C.muted }}>{b}</div>
          </Abs>
        );
      })}
      {t.step >= 2 && (
        <Abs x={960} y={290} w={880} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...card(C.red), padding: "14px 22px", ...rise(f, at(t, 2)) }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.red, letterSpacing: 2 }}>BROKEN</div>
            <Code size={23}>{'data = json.loads(resp.content)\n# "Sure! Here is the JSON: {…" → crash\nflight = data["flight_no"]  # KeyError'}</Code>
          </div>
          <div style={{ ...card(C.green), padding: "14px 22px", ...rise(f, at(t, 2) + 20) }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.green, letterSpacing: 2 }}>FIXED · PYDANTIC SCHEMA</div>
            <Code size={23}>{'class Request(BaseModel):\n    intent: Literal["status", "rebook", "refund"]\n    flight_no: str | None\n\nllm.with_structured_output(Request)'}</Code>
          </div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the loop

export const A5Loop = ({ t }: CP) => {
  const f = t.frame;
  const C0 = { x: 560, y: 560 };
  const R = 250;
  const nodes: [string, string, number, string][] = [
    ["🧠", "model", -90, C.purple],
    ["🔧", "tool calls?", 30, C.amber],
    ["⚙️", "run tools", 150, C.green],
  ];
  const pos = (a: number) => ({ x: C0.x + R * Math.cos((a * Math.PI) / 180), y: C0.y + R * Math.sin((a * Math.PI) / 180) });
  const spin = t.step >= 1 ? ((f - at(t, 1)) / 70) % 1 : 0;
  const dot = pos(-90 + spin * 360);
  const steps = t.step >= 1 ? Math.min(3, 1 + Math.floor((f - at(t, 1)) / 70)) : 0;
  const trace: string[] = ["get_flight_status(AB123) → cancelled", "get_booking(XK7P2Q) → seat 14C, economy", "search_policy(“cancellation compensation”) → §7.2"];
  return (
    <>
      <Svg>
        <circle cx={C0.x} cy={C0.y} r={R} fill="none" stroke={C.line} strokeWidth={4} strokeDasharray="14 10" opacity={enter(f, 4)} />
        {t.step >= 1 && t.step < 3 && <circle cx={dot.x} cy={dot.y} r={14} fill={C.blue} style={{ filter: `drop-shadow(0 0 10px ${C.blue})` }} />}
        {t.step >= 2 && <Arrow x1={pos(30).x + 90} y1={pos(30).y} x2={1060} y2={pos(30).y} color={C.green} p={ease(f, at(t, 2), 20)} />}
      </Svg>
      {nodes.map(([i, n, a, col]) => {
        const p = pos(a);
        return (
          <Abs key={n} x={p.x - 110} y={p.y - 60} w={220} style={{ ...card(col), padding: "12px 0", textAlign: "center", opacity: enter(f, 6) }}>
            <div style={{ fontSize: 40 }}>{i}</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{n}</div>
          </Abs>
        );
      })}
      <Abs x={C0.x - 160} y={C0.y - 30} w={320} style={{ textAlign: "center", fontSize: 26, color: C.muted, fontWeight: 700, opacity: enter(f, 10) }}>
        results appended to the messages
      </Abs>
      {t.step >= 1 && (
        <Abs x={1080} y={250} w={760} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {trace.slice(0, steps).map((s, i) => (
            <div key={i} style={{ ...card(), padding: "10px 18px", fontFamily: MONO, fontSize: 22, ...rise(f, at(t, 1) + i * 70) }}>
              step {i + 1}: {s}
            </div>
          ))}
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1080} y={pos(30).y - 40} w={760} style={{ ...card(C.green), padding: "14px 20px", fontSize: 27, ...rise(f, at(t, 2) + 10) }}>
          no tool calls → final answer: “AB123 is cancelled. I can rebook you on AB125 at 18:40. You're owed €250 under §7.2.”
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={1080} y={800} w={760} style={{ ...rise(f, at(t, 3)) }}>
          <Chip color={C.red} style={{ fontSize: 28 }}>
            MAX_STEPS = 8: a hard stop
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ middleware order

export const A5Middleware = ({ t }: CP) => {
  const f = t.frame;
  const rings: [string, string][] = [
    ["m1", C.blue],
    ["m2", C.purple],
    ["m3", C.green],
  ];
  const fixes: [string, string][] = [
    ["40 tool calls in one run", "ModelCallLimit · ToolCallLimit"],
    ["an email address in a trace", "PII masking"],
    ["provider outage on Friday", "ModelRetry · ModelFallback"],
    ["long, slow conversations", "Summarization · ContextEditing"],
    ["a refund needs a person", "HumanInTheLoop (chapter 7)"],
  ];
  return (
    <>
      {t.step <= 1 && (
        <>
          {rings.map(([n, col], i) => (
            <Abs key={n} x={120 + i * 70} y={240 + i * 70} w={760 - i * 140} h={560 - i * 140} style={{ border: `4px solid ${col}`, borderRadius: 30, background: `${col}0d`, opacity: enter(f, 6 + i * 8) }}>
              <div style={{ position: "absolute", left: 18, top: 8, fontFamily: MONO, fontSize: 26, fontWeight: 800, color: col }}>{n}</div>
            </Abs>
          ))}
          <Abs x={330} y={460} w={340} style={{ ...card(C.amber), padding: "16px 0", textAlign: "center", fontSize: 30, fontWeight: 800, opacity: enter(f, 30) }}>
            model call
          </Abs>
          <Abs x={960} y={260} w={880} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ ...card(C.blue), padding: "14px 22px", fontSize: 28, ...rise(f, 20) }}>
              <b>before_*</b> hooks run in order: <span style={{ fontFamily: MONO }}>m1 → m2 → m3</span>
            </div>
            <div style={{ ...card(C.green), padding: "14px 22px", fontSize: 28, ...rise(f, 34) }}>
              <b>after_*</b> hooks run in reverse: <span style={{ fontFamily: MONO }}>m3 → m2 → m1</span>
            </div>
            <div style={{ ...card(C.purple), padding: "14px 22px", fontSize: 28, ...rise(f, 48) }}>
              <b>wrap_*</b> hooks nest like an onion: m1 outermost
            </div>
            {t.step >= 1 && (
              <div style={{ ...card(C.amber), padding: "14px 22px", fontSize: 28, ...rise(f, at(t, 1)) }}>
                logging and retries first (see everything) · PII masking last (right before the model)
              </div>
            )}
          </Abs>
        </>
      )}
      {t.step >= 2 && (
        <Abs x={80} y={230} w={1760} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {fixes.map(([p, m], i) => (
            <div key={p} style={{ ...card(PALETTE[i]), padding: "14px 24px", display: "flex", justifyContent: "space-between", fontSize: 30, ...rise(f, at(t, 2) + i * 10) }}>
              <span>{p}</span>
              <span style={{ fontFamily: MONO, fontSize: 27, color: PALETTE[i] }}>{m}</span>
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ StateGraph

export const A5Graph = ({ t }: CP) => {
  const f = t.frame;
  const N: Record<string, [number, number, string, string]> = {
    START: [140, 520, "START", C.muted],
    classify: [400, 520, "classify", C.purple],
    policy: [720, 360, "search_policy", C.blue],
    answer: [1040, 360, "answer", C.green],
    booking: [720, 680, "get_booking", C.blue],
    rebook: [1040, 680, "rebook", C.amber],
    END: [1300, 520, "END", C.muted],
  };
  const E: [string, string, boolean, string?][] = [
    ["START", "classify", false],
    ["classify", "policy", true, "question"],
    ["classify", "booking", true, "change"],
    ["policy", "answer", false],
    ["booking", "rebook", false],
    ["answer", "END", false],
    ["rebook", "END", false],
  ];
  const showEdges = t.step >= 2;
  return (
    <>
      <Svg>
        {showEdges &&
          E.map(([a, b, cond], i) => {
            const A = N[a];
            const B = N[b];
            const dx = B[0] - A[0];
            const dy = B[1] - A[1];
            const L = Math.hypot(dx, dy);
            return <Arrow key={i} x1={A[0] + (dx / L) * 110} y1={A[1] + (dy / L) * 40} x2={B[0] - (dx / L) * 110} y2={B[1] - (dy / L) * 40} color={cond ? C.amber : C.muted} dash={cond} p={ease(f, at(t, 2) + i * 5, 16)} />;
          })}
      </Svg>
      {Object.entries(N).map(([k, [x, y, label, col]], i) => {
        const show = t.step >= 1 || k === "START" || k === "END";
        return (
          <Abs key={k} x={x - 100} y={y - 34} w={200} style={{ ...card(col), padding: "12px 0", textAlign: "center", fontFamily: MONO, fontSize: 24, fontWeight: 700, opacity: show ? enter(f, (k === "START" || k === "END" ? 6 : at(t, 1)) + i * 4) : 0 }}>
            {label}
          </Abs>
        );
      })}
      {showEdges && (
        <>
          <Abs x={480} y={390} w={160} style={{ fontSize: 22, color: C.amber, fontWeight: 700, opacity: enter(f, at(t, 2) + 20) }}>
            question
          </Abs>
          <Abs x={480} y={620} w={160} style={{ fontSize: 22, color: C.amber, fontWeight: 700, opacity: enter(f, at(t, 2) + 20) }}>
            change
          </Abs>
        </>
      )}
      <Abs x={1440} y={260} w={400} style={{ ...card(C.cyan), padding: "16px 20px", ...rise(f, 8) }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.cyan, letterSpacing: 2 }}>STATE · THE WHITEBOARD</div>
        <Code size={22}>{"messages: [...]\nintent: \"rebook\"\nbooking: {...}\ntries: 0"}</Code>
      </Abs>
      {t.step >= 3 && (
        <Abs x={1440} y={520} w={400} style={{ ...card(C.purple), padding: "16px 20px", fontSize: 24, lineHeight: 1.35, ...rise(f, at(t, 3)) }}>
          <b>reducer</b>: how a node's update is written. Default replaces; <span style={{ fontFamily: MONO }}>add_messages</span> appends
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={80} y={820} w={1300} style={{ fontSize: 28, color: C.green, fontWeight: 700, ...rise(f, at(t, 4)) }}>
          no path skips the policy search or the booking lookup: the graph enforces it
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ super-steps

export const A5Super = ({ t }: CP) => {
  const f = t.frame;
  const round = (x: number, label: string, nodes: string[], col: string, st: number) => (
    <Abs x={x} y={280} w={460} style={{ ...card(t.step === st ? col : C.line), padding: "18px 22px", ...rise(f, at(t, st)) }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: col, letterSpacing: 2 }}>{label}</div>
      <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
        {nodes.map((n) => (
          <div key={n} style={{ ...card(), padding: "10px 16px", fontFamily: MONO, fontSize: 24 }}>
            {n}
          </div>
        ))}
      </div>
    </Abs>
  );
  return (
    <>
      {round(80, "SUPER-STEP 1", ["classify"], C.purple, 0)}
      {t.step >= 1 && round(600, "SUPER-STEP 2 · PARALLEL", ["get_booking", "flight_status"], C.blue, 1)}
      {t.step >= 1 && (
        <Abs x={1120} y={280} w={720} style={{ ...card(C.green), padding: "18px 22px", fontSize: 27, lineHeight: 1.4, ...rise(f, at(t, 1) + 20) }}>
          at the end of the round: updates merged through reducers, state saved, edges pick the next round
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={80} y={560} w={1760} style={{ ...card(C.red), padding: "18px 26px", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 30, fontWeight: 800 }}>two parallel nodes write <span style={{ fontFamily: MONO }}>status</span>, no reducer →</div>
          <div style={{ fontFamily: MONO, fontSize: 30, color: C.red, marginTop: 8 }}>InvalidUpdateError</div>
          <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>fix: add a reducer, or give each node its own field · parallel nodes never see each other's updates mid-round</div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={790} w={1760} style={{ ...rise(f, at(t, 3)) }}>
          <Chip color={C.amber} style={{ fontSize: 28 }}>
            brakes: a counter in state · a fallback route · recursion_limit · a token/time budget
          </Chip>
        </Abs>
      )}
    </>
  );
};

