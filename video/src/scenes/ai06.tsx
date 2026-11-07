// Chapter 6 (Agents that remember), told with a general example: an online
// store's support agent that must survive crashes and remember customers.
import { C, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, during } from "./custom3.tsx";
import { Arrow, Svg, type CP } from "./secui.tsx";

const Code = ({ children, size = 24 }: { children: string; size?: number }) => <div style={{ fontFamily: MONO, fontSize: size, whiteSpace: "pre", lineHeight: 1.4 }}>{children}</div>;

// ------------------------------------------------------------------ hook

export const A6Hook = ({ t }: CP) => {
  const f = t.frame;
  const items: [string, string, string][] = [
    ["🫥", "“and the second item?”", "every call starts from zero"],
    ["💥", "server crash mid-run", "the whole run starts over"],
    ["💸", "a $40 refund, issued twice", "after an automatic retry"],
    ["🐢", "message 60: 40,000 tokens", "slower and pricier every turn"],
  ];
  return (
    <>
      <Abs x={80} y={170} w={1220} style={{ fontSize: 44, fontWeight: 800, ...rise(f, 2) }}>
        The agent works. Then production happens.
      </Abs>
      <Abs x={80} y={280} w={1760} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {items.map(([i, a, b], k) =>
          t.step >= k ? (
            <div key={k} style={{ ...card(t.step === k ? C.red : C.line), padding: "22px 28px", display: "flex", gap: 22, alignItems: "center", ...rise(f, at(t, k)) }}>
              <div style={{ fontSize: 56 }}>{i}</div>
              <div>
                <div style={{ fontSize: 33, fontWeight: 800 }}>{a}</div>
                <div style={{ fontSize: 26, color: C.muted, marginTop: 4 }}>{b}</div>
              </div>
            </div>
          ) : (
            <div key={k} />
          ),
        )}
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ checkpoints

export const A6Save = ({ t }: CP) => {
  const f = t.frame;
  const steps = ["classify", "get_order", "check_policy", "issue_refund", "reply"];
  const X = (i: number) => 240 + i * 360;
  const crashAt = 3;
  const crashed = t.step >= 2;
  const resumed = t.step >= 3;
  const run = t.step >= 1 ? Math.min(steps.length, Math.floor(ease(f, at(t, 1), 60) * 4) + 1) : 0;
  return (
    <>
      <Abs x={80} y={180} w={1220} style={{ fontFamily: MONO, fontSize: 30, ...rise(f, 2) }}>
        thread_id = <span style={{ color: C.amber }}>"cust-48213"</span>
      </Abs>
      <Svg>
        {steps.slice(0, -1).map((_, i) => (
          <Arrow key={i} x1={X(i) + 140} y1={420} x2={X(i + 1) - 140} y2={420} color={C.line} />
        ))}
      </Svg>
      {steps.map((s, i) => {
        const done = (t.step >= 1 && i < run && (!crashed || i < crashAt)) || (resumed && i <= crashAt + (ease(f, at(t, 3) + 20, 40) > 0.9 ? 1 : 0));
        const boom = crashed && !resumed && i === crashAt;
        const redo = resumed && i === crashAt;
        return (
          <Abs key={s} x={X(i) - 140} y={370} w={280} style={{ ...card(boom ? C.red : redo ? C.amber : done ? C.green : C.line), padding: "18px 0", textAlign: "center", fontFamily: MONO, fontSize: 26, fontWeight: 700, opacity: enter(f, 6 + i * 4) }}>
            {s}
          </Abs>
        );
      })}
      {steps.slice(0, -1).map((_, i) => {
        const saved = t.step >= 1 && i < Math.min(run, crashed ? crashAt : 99);
        return saved ? (
          <Abs key={i} x={X(i) - 40} y={480} w={80} style={{ textAlign: "center", fontSize: 40, ...rise(f, at(t, 1) + i * 15) }}>
            💾
          </Abs>
        ) : null;
      })}
      {t.step >= 1 && (
        <Abs x={80} y={560} w={1220} style={{ fontSize: 28, color: C.muted, fontWeight: 700, ...rise(f, at(t, 1) + 30) }}>
          💾 a checkpoint: the whole state, saved after every super-step
        </Abs>
      )}
      {crashed && !resumed && (
        <Abs x={X(crashAt) - 200} y={250} w={400} style={{ textAlign: "center", fontSize: 60, transform: `scale(${Math.min(1, pop(f, at(t, 2)))})` }}>
          💥
        </Abs>
      )}
      {resumed && (
        <Abs x={80} y={640} w={1760} style={{ ...card(C.amber), padding: "18px 26px", fontSize: 30, fontWeight: 700, ...rise(f, at(t, 3)) }}>
          resume: load the last save · classify, get_order, check_policy are not repeated · <span style={{ color: C.amber }}>issue_refund runs again, from its first line</span>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ idempotency

export const A6Lift = ({ t }: CP) => {
  const f = t.frame;
  const presses = t.step === 0 ? Math.min(5, Math.floor(Math.max(0, f - 20) / 12)) : 5;
  return (
    <>
      {t.step === 0 && (
        <Abs x={160} y={250} w={1600} style={{ display: "flex", alignItems: "center", gap: 60, opacity: during(t, 0) }}>
          <div style={{ width: 200, height: 200, borderRadius: 999, border: `8px solid ${C.amber}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 100, transform: `scale(${presses % 2 ? 0.92 : 1})`, boxShadow: `0 0 40px ${C.amber}66` }}>▲</div>
          <div>
            <div style={{ fontSize: 46, fontWeight: 800 }}>pressed {presses}×</div>
            <div style={{ fontSize: 46, fontWeight: 800, color: C.green, marginTop: 10 }}>the lift comes once</div>
            <div style={{ fontSize: 30, color: C.muted, marginTop: 14 }}>idempotent: repeating it has no extra effect</div>
          </div>
        </Abs>
      )}
      {t.step >= 1 && (
        <Abs x={80} y={270} w={860} style={{ ...card(C.red), padding: "18px 24px", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.red, letterSpacing: 2 }}>BROKEN</div>
          <Code>{"def issue_refund(state):\n    payments.refund(state[\"order_id\"],\n                    amount=40)\n    return {\"refunded\": True}"}</Code>
          <div style={{ fontSize: 26, color: C.red, marginTop: 10, fontWeight: 700 }}>re-run after a crash → refunded twice</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={980} y={270} w={860} style={{ ...card(C.green), padding: "18px 24px", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.green, letterSpacing: 2 }}>FIXED · IDEMPOTENCY KEY</div>
          <Code>{`def issue_refund(state):
    key = f"refund:{state['case_id']}"
    payments.refund(state["order_id"], 40,
                    idempotency_key=key)
    return {"refunded": True}`}</Code>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={560} w={1760} style={{ display: "flex", alignItems: "center", gap: 20, ...rise(f, at(t, 3)) }}>
          {[
            ["1st call", "key new → refund $40", C.green],
            ["retry", "key seen → return the first result", C.blue],
          ].map(([a, b, col], i) => (
            <div key={i} style={{ flex: 1, ...card(col), padding: "18px 24px" }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: col }}>{a}</div>
              <div style={{ fontFamily: MONO, fontSize: 26, marginTop: 6 }}>{b}</div>
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ time travel

export const A6Time = ({ t }: CP) => {
  const f = t.frame;
  const X = (i: number) => 180 + i * 260;
  const fork = t.step >= 2;
  return (
    <>
      <Abs x={80} y={180} w={1220} style={{ fontSize: 30, fontWeight: 800, color: C.muted, ...rise(f, 2) }}>
        a thread's history: every checkpoint is kept
      </Abs>
      <Svg>
        <line x1={X(0)} y1={380} x2={X(5)} y2={380} stroke={C.line} strokeWidth={4} />
        {fork && <path d={`M ${X(2)} 380 C ${X(2) + 100} 380, ${X(2) + 80} 560, ${X(3)} 560 L ${X(5)} 560`} stroke={C.green} strokeWidth={4} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(f, at(t, 2) + 10, 30)} />}
      </Svg>
      {Array.from({ length: 6 }, (_, i) => (
        <Abs key={i} x={X(i) - 34} y={346} w={68} h={68} style={{ borderRadius: 999, background: t.step >= 1 && i === 2 ? C.amber : C.card, border: `3px solid ${t.step >= 1 && i === 2 ? C.amber : C.blue}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 24, fontWeight: 800, opacity: enter(f, 6 + i * 4) }}>
          c{i + 1}
        </Abs>
      ))}
      {fork &&
        [3, 4, 5].map((i) => (
          <Abs key={i} x={X(i) - 34} y={526} w={68} h={68} style={{ borderRadius: 999, background: C.card, border: `3px solid ${C.green}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 22, fontWeight: 800, opacity: enter(f, at(t, 2) + 20 + i * 4) }}>
            c{i + 1}′
          </Abs>
        ))}
      <Abs x={X(0) - 60} y={440} w={1600} style={{ fontFamily: MONO, fontSize: 26, color: C.muted, opacity: enter(f, 20) }}>
        get_state_history(thread)
      </Abs>
      {t.step >= 1 && (
        <Abs x={X(2) - 200} y={250} w={400} style={{ textAlign: "center", fontSize: 26, fontWeight: 700, color: C.amber, ...rise(f, at(t, 1)) }}>
          what did the agent see here?
        </Abs>
      )}
      {fork && (
        <Abs x={X(3) + 60} y={620} w={800} style={{ fontSize: 26, fontWeight: 700, color: C.green, ...rise(f, at(t, 2) + 30) }}>
          update_state at c3, continue: a new branch (model calls run again)
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={720} w={1760} style={{ display: "flex", gap: 18, ...rise(f, at(t, 3)) }}>
          {[
            ["reject", "the 2nd message"],
            ["enqueue", "run it after"],
            ["interrupt", "stop, keep progress"],
            ["rollback", "undo, start fresh"],
          ].map(([a, b], i) => (
            <div key={a} style={{ flex: 1, ...card(PALETTE[i]), padding: "14px 18px", opacity: enter(f, at(t, 3) + i * 8) }}>
              <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: PALETTE[i] }}>{a}</div>
              <div style={{ fontSize: 24, color: C.muted }}>{b}</div>
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ context engineering

export const A6Context = ({ t }: CP) => {
  const f = t.frame;
  const strategies: [string, string, string, string][] = [
    ["✍️", "Write", "save notes outside the window: a scratchpad, a memory store", C.blue],
    ["🎯", "Select", "pull in only what this step needs: memories, docs, tools", C.green],
    ["🗜️", "Compress", "summarise old turns, trim used tool output", C.amber],
    ["📦", "Isolate", "split work across sub-agents or state fields", C.purple],
  ];
  const fill = [0.92, 0.7, 0.45, 0.35][Math.min(3, t.step)];
  return (
    <>
      <Abs x={80} y={190} w={1220} style={{ ...rise(f, 2) }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>THE CONTEXT WINDOW, THIS CALL</div>
        <div style={{ marginTop: 12, height: 70, borderRadius: 14, border: `3px solid ${fill > 0.8 ? C.red : C.line}`, background: C.bg, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${lerp(92, fill * 100, ease(f, at(t, t.step), 30))}%`, background: `linear-gradient(90deg, ${C.purple}88, ${C.blue}88, ${C.amber}88)` }} />
        </div>
      </Abs>
      <Abs x={80} y={340} w={1760} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        {strategies.map(([i, n, d, col], k) =>
          t.step >= k ? (
            <div key={n} style={{ ...card(t.step === k ? col : C.line), padding: "20px 26px", display: "flex", gap: 20, alignItems: "center", ...rise(f, at(t, k)) }}>
              <div style={{ fontSize: 50 }}>{i}</div>
              <div>
                <div style={{ fontSize: 36, fontWeight: 800, color: col }}>{n}</div>
                <div style={{ fontSize: 27, color: C.muted, marginTop: 4 }}>{d}</div>
              </div>
            </div>
          ) : (
            <div key={n} />
          ),
        )}
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ short-term memory

export const A6Window = ({ t }: CP) => {
  const f = t.frame;
  const n = 14;
  const keep = t.step >= 1 ? 5 : n;
  return (
    <>
      <Abs x={80} y={190} w={620} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {t.step >= 1 && (
          <div style={{ ...card(C.amber), padding: "12px 18px", fontSize: 25, ...rise(f, at(t, 1)) }}>
            📝 summary of messages 1–55: order #48213, $40 refund approved, customer prefers email…
          </div>
        )}
        {Array.from({ length: n }, (_, i) => {
          const gone = i < n - keep;
          if (gone && t.step >= 1) return null;
          return (
            <div key={i} style={{ height: 34, borderRadius: 8, background: i % 2 ? `${C.blue}55` : `${C.green}44`, width: `${60 + ((i * 37) % 40)}%`, alignSelf: i % 2 ? "flex-end" : "flex-start", opacity: enter(f, 4 + i * 2) }} />
          );
        })}
      </Abs>
      <Abs x={760} y={200} w={1080} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ ...card(t.step === 0 ? C.red : C.line), padding: "16px 22px", fontSize: 29, ...rise(f, 8) }}>
          60 messages = 40,000 tokens · every answer slower and pricier · the order number from message 1 is buried
        </div>
        {t.step >= 1 && (
          <div style={{ ...card(C.amber), padding: "16px 22px", fontSize: 29, ...rise(f, at(t, 1)) }}>
            recent messages word for word · older ones summarised
          </div>
        )}
        {t.step >= 2 && (
          <div style={{ ...card(C.green), padding: "16px 22px", ...rise(f, at(t, 2)) }}>
            <div style={{ fontSize: 29 }}>pinned facts live in their own state fields: never trimmed</div>
            <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
              <Chip color={C.green} style={{ fontFamily: MONO }}>order_id: 48213</Chip>
              <Chip color={C.green} style={{ fontFamily: MONO }}>customer_id: c-981</Chip>
            </div>
          </div>
        )}
        {t.step >= 3 && (
          <div style={{ ...card(C.purple), padding: "16px 22px", fontSize: 29, ...rise(f, at(t, 3)) }}>
            old tool outputs: clear once used · big ones go to a store, with just a reference in the chat
          </div>
        )}
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ long-term memory

export const A6Store = ({ t }: CP) => {
  const f = t.frame;
  const kinds: [string, string, string, string][] = [
    ["Semantic", "facts", "“prefers email, not calls”", C.blue],
    ["Episodic", "experiences", "“last refund dispute: solved by a store credit”", C.green],
    ["Procedural", "how to behave", "“answer in Spanish; keep it short”", C.purple],
  ];
  return (
    <>
      <Abs x={80} y={190} w={760} style={{ ...card(C.cyan), padding: "18px 24px", ...rise(f, 4) }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.cyan, letterSpacing: 2 }}>STORE · OUTLIVES THREADS</div>
        <Code size={24}>{'namespace ("customers", "c-981")\n{ "prefers": "email",\n  "language": "es",\n  "updated": "2026-10-02",\n  "source": "chat 2026-10-02" }'}</Code>
      </Abs>
      <Abs x={900} y={190} w={940} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {kinds.map(([n, a, ex, col], i) =>
          t.step >= 1 ? (
            <div key={n} style={{ ...card(col), padding: "14px 22px", ...rise(f, at(t, 1) + i * 14) }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: col }}>
                {n} <span style={{ color: C.muted, fontSize: 25, fontWeight: 600 }}>· {a}</span>
              </div>
              <div style={{ fontSize: 26, marginTop: 4 }}>{ex}</div>
            </div>
          ) : null,
        )}
      </Abs>
      {t.step >= 2 && (
        <Abs x={80} y={640} w={1760} style={{ display: "flex", gap: 24 }}>
          {[
            ["🔥 in the hot path", "the agent calls save_memory mid-chat: immediate, adds latency, relies on its judgement", C.amber],
            ["🌙 in the background", "a job extracts memories after the chat: no latency, better extraction, slightly delayed", C.green],
          ].map(([a, b, col], i) => (
            <div key={a} style={{ flex: 1, ...card(col), padding: "16px 24px", ...rise(f, at(t, 2) + i * 12) }}>
              <div style={{ fontSize: 30, fontWeight: 800 }}>{a}</div>
              <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>{b}</div>
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ fan-out with Send

export const A6FanOut = ({ t }: CP) => {
  const f = t.frame;
  const n = 12;
  const go = t.step >= 1 ? ease(f, at(t, 1), 40) : 0;
  const done = t.step >= 2 ? ease(f, at(t, 2), 50) : 0;
  return (
    <>
      <Abs x={80} y={430} w={260} style={{ ...card(C.blue), padding: "18px 0", textAlign: "center", ...rise(f, 4) }}>
        <div style={{ fontSize: 44 }}>📧</div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>500 emails</div>
      </Abs>
      <Svg>
        {Array.from({ length: n }, (_, i) => {
          const y = 230 + i * 50;
          return (
            <g key={i} opacity={go}>
              <line x1={340} y1={490} x2={lerp(340, 780, go)} y2={lerp(490, y + 18, go)} stroke={C.blue} strokeWidth={2} />
              {t.step >= 2 && <line x1={1000} y1={y + 18} x2={lerp(1000, 1420, done)} y2={lerp(y + 18, 490, done)} stroke={C.green} strokeWidth={2} />}
            </g>
          );
        })}
      </Svg>
      {Array.from({ length: n }, (_, i) => (
        <Abs key={i} x={780} y={230 + i * 50} w={220} h={38} style={{ borderRadius: 8, background: i === 7 && t.step >= 3 ? `${C.red}55` : t.step >= 2 && done > i / n ? `${C.green}55` : C.card, border: `2px solid ${i === 7 && t.step >= 3 ? C.red : C.line}`, fontFamily: MONO, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", opacity: go }}>
          {i === n - 1 ? "… ×500" : `summarise #${i + 1}`}
        </Abs>
      ))}
      {t.step >= 2 && (
        <Abs x={1420} y={430} w={300} style={{ ...card(C.green), padding: "18px 0", textAlign: "center", ...rise(f, at(t, 2) + 30) }}>
          <div style={{ fontSize: 44 }}>📊</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>combine → report</div>
        </Abs>
      )}
      {t.step >= 1 && (
        <Abs x={80} y={220} w={660} style={{ fontFamily: MONO, fontSize: 24, color: C.blue, ...rise(f, at(t, 1)) }}>
          {"return [Send(\"summarise\", e)\n        for e in emails]"}
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={850} w={1760} style={{ display: "flex", gap: 14, ...rise(f, at(t, 3)) }}>
          {["max_concurrency below the rate limit", "retry policy with backoff", "finished branches not redone on resume"].map((s, i) => (
            <Chip key={s} color={[C.amber, C.red, C.green][i]} style={{ fontSize: 24 }}>
              {s}
            </Chip>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ multi-agent patterns

export const A6Team = ({ t }: CP) => {
  const f = t.frame;
  const box = (x: number, y: number, label: string, col: string, o = 1) => (
    <Abs x={x - 90} y={y - 30} w={180} style={{ ...card(col), padding: "10px 0", textAlign: "center", fontSize: 24, fontWeight: 800, opacity: o }}>
      {label}
    </Abs>
  );
  const panel = (i: number, title: string, desc: string) => (
    <Abs x={80 + i * 600} y={270} w={560} style={{ ...card(t.step === i ? C.blue : C.line), padding: "16px 22px", opacity: t.step >= i ? 1 : 0.15, ...rise(f, at(t, i)) }}>
      <div style={{ fontSize: 34, fontWeight: 800 }}>{title}</div>
      <div style={{ fontSize: 25, color: C.muted, marginTop: 6 }}>{desc}</div>
    </Abs>
  );
  const cx = [360, 960, 1560];
  return (
    <>
      {panel(0, "Supervisor", "a manager agent routes every turn; easy to log, one extra hop")}
      {panel(1, "Handoffs (swarm)", "the active agent passes control directly; faster, rules harder to enforce")}
      {panel(2, "Agent as a tool", "specialists return summaries to one main agent, which keeps the whole picture")}
      <Svg>
        {[cx[0] - 160, cx[0], cx[0] + 160].map((x, i) => <Arrow key={i} x1={cx[0]} y1={520} x2={x} y2={690} color={C.blue} p={ease(f, 10 + i * 6, 16)} />)}
        {t.step >= 1 && <Arrow x1={cx[1] - 46} y1={598} x2={cx[1] + 46} y2={598} color={C.purple} p={ease(f, at(t, 1), 16)} />}
        {t.step >= 1 && <Arrow x1={cx[1] + 46} y1={626} x2={cx[1] - 46} y2={626} color={C.purple} p={ease(f, at(t, 1) + 16, 16)} />}
        {t.step >= 2 && [cx[2] - 160, cx[2] + 160].map((x, i) => <Arrow key={i} x1={cx[2]} y1={520} x2={x} y2={690} color={C.green} dash p={ease(f, at(t, 2) + i * 8, 16)} />)}
      </Svg>
      {box(cx[0], 490, "supervisor", C.blue)}
      {[cx[0] - 160, cx[0], cx[0] + 160].map((x, i) => box(x, 720, ["orders", "refunds", "shipping"][i], C.line))}
      {t.step >= 1 && box(cx[1] - 140, 612, "triage", C.purple, enter(f, at(t, 1)))}
      {t.step >= 1 && box(cx[1] + 140, 612, "refunds", C.purple, enter(f, at(t, 1) + 10))}
      {t.step >= 2 && box(cx[2], 490, "main agent", C.green, enter(f, at(t, 2)))}
      {t.step >= 2 && [cx[2] - 160, cx[2] + 160].map((x, i) => box(x, 720, ["research", "billing"][i], C.line, enter(f, at(t, 2) + 10)))}
    </>
  );
};
