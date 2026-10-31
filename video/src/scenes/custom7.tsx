// Chapter 5 scenes (from assistant to agent): the model writes the order
// slip and your code cooks, then the loop, LangChain's middleware conveyor and
// LangGraph's subway map. Widths only, never heights; the top-right corner
// stays free for the term card.
import type { CSSProperties, ReactNode } from "react";
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

const Arrow = ({ x1, y1, x2, y2, color = C.muted, p = 1 }: { x1: number; y1: number; x2: number; y2: number; color?: string; p?: number }) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g>
      <line x1={x1} y1={y1} x2={lerp(x1, x2, p)} y2={lerp(y1, y2, p)} stroke={color} strokeWidth={4} strokeLinecap="round" />
      {p > 0.95 && <polygon points={`${x2},${y2} ${x2 - 18 * Math.cos(a - 0.42)},${y2 - 18 * Math.sin(a - 0.42)} ${x2 - 18 * Math.cos(a + 0.42)},${y2 - 18 * Math.sin(a + 0.42)}`} fill={color} />}
    </g>
  );
};

const Station = ({ x, y, w, icon, label, sub, color = C.line, style }: { x: number; y: number; w: number; icon: string; label: string; sub?: string; color?: string; style?: CSSProperties }) => (
  <Abs x={x} y={y} w={w} style={{ ...card(color), padding: "20px 18px", textAlign: "center", ...style }}>
    <div style={{ fontSize: 80, lineHeight: 1 }}>{icon}</div>
    <div style={{ fontSize: 32, fontWeight: 800, marginTop: 10 }}>{label}</div>
    {sub && <div style={{ fontSize: 24, color: C.muted, marginTop: 4 }}>{sub}</div>}
  </Abs>
);

// ------------------------------------------------------------------ the model writes the slip, your code cooks

export const Restaurant = ({ t }: CP) => {
  const f = t.frame;
  const slip = t.step >= 2 ? clamp01((f - at(t, 2) - 30) / 150) : 0;
  const sx = slip < 0.5 ? lerp(330, 940, slip * 2) : lerp(940, 1560, (slip - 0.5) * 2);
  return (
    <>
      {t.step < 2 && (
        <div style={{ opacity: 1 - from(t, 2) }}>
          <Station x={260} y={330} w={340} icon="🤖" label="the model" style={rise(f, 4)} />
          <Station x={1320} y={330} w={340} icon="🗄️" label="orders database" style={rise(f, 14)} />
          <Svg>
            <Arrow x1={620} y1={430} x2={1300} y2={430} p={ease(f, 24, 20)} color={C.red} />
          </Svg>
          <Abs x={660} y={370} w={600} style={{ textAlign: "center", fontSize: 30, fontWeight: 700, color: C.red, ...rise(f, 40) }}>a direct connection?</Abs>
          {t.step >= 1 && (
            <Abs x={160} y={690} w={1600} style={{ display: "flex", gap: 24, justifyContent: "center", ...rise(f, at(t, 1)) }}>
              {["😵 it gets confused", "🎭 it can be tricked by what it reads", "🤷 it can't be held accountable"].map((s, i) => (
                <Chip key={s} color={C.red} style={{ fontSize: 30, opacity: enter(f, at(t, 1) + i * 14) }}>{s}</Chip>
              ))}
            </Abs>
          )}
        </div>
      )}
      {t.step >= 2 && (
        <div style={{ opacity: from(t, 2) }}>
          <Station x={180} y={300} w={300} icon="🧑" label="customer" sub="writes the order" color={t.step >= 3 ? C.purple : C.line} />
          <Station x={810} y={300} w={300} icon="🤵" label="waiter" sub="checks it" color={t.step >= 3 ? C.blue : C.line} />
          <Station x={1440} y={300} w={300} icon="👨‍🍳" label="kitchen" sub="cooks it" color={t.step >= 3 ? C.blue : C.line} />
          <Abs x={sx - 80} y={slip > 0.45 && slip < 0.6 ? 560 : 580} w={170} style={{ background: "#f4efe2", color: "#2a2a2a", borderRadius: 6, padding: "10px 12px", fontSize: 22, fontFamily: MONO, transform: `rotate(${Math.sin(f / 9) * 4}deg)`, opacity: enter(f, at(t, 2) + 20) }}>
            1 × paneer tikka{slip > 0.5 && <span style={{ color: "#1a9a5a", fontWeight: 800 }}> ✓</span>}
          </Abs>
          {t.step >= 3 && (
            <>
              {[
                [180, "= the model", C.purple],
                [810, "= your code", C.blue],
                [1440, "= your code", C.blue],
              ].map(([x, s, col], i) => (
                <Abs key={i} x={x as number} y={720} w={300} style={{ textAlign: "center", fontSize: 34, fontWeight: 800, color: col as string, ...rise(f, at(t, 3) + i * 14) }}>
                  {s as string}
                </Abs>
              ))}
            </>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ what a tool is, and what a tool call is

export const ToolCard = ({ t }: CP) => {
  const f = t.frame;
  const row = (k: string, v: ReactNode, start: number, mono = false) => (
    <div style={{ padding: "14px 0", borderTop: `1px solid ${C.line}`, ...rise(f, start, 14) }}>
      <div style={{ fontSize: 22, color: C.muted, fontWeight: 700, letterSpacing: 1 }}>{k}</div>
      <div style={{ fontSize: 30, fontWeight: 700, fontFamily: mono ? MONO : undefined, marginTop: 4 }}>{v}</div>
    </div>
  );
  return (
    <>
      <Abs x={120} y={270} w={780} style={{ ...card(C.blue), padding: "22px 30px" }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: C.blue, marginBottom: 8, ...rise(f, 4) }}>🛠️ a tool, as the model sees it</div>
        {row("NAME", "get_order", 14, true)}
        {row("DESCRIPTION", "Look up one order's status, items and delivery times, by order id like FC-12345", 34)}
        {t.step >= 1 && row("SCHEMA", "order_id: string", at(t, 1), true)}
      </Abs>
      {t.step >= 2 && (
        <Abs x={1020} y={300} w={760} style={{ ...card(C.purple), padding: "22px 30px", opacity: Math.min(1, pop(f, at(t, 2))) }}>
          <div style={{ fontSize: 26, color: C.purple, fontWeight: 800 }}>🤖 the model's reply: a tool call</div>
          <div style={{ fontFamily: MONO, fontSize: 30, marginTop: 12, lineHeight: 1.5 }}>
            name: get_order
            <br />
            args: {"{"} order_id: "FC-20931" {"}"}
            <br />
            id: <span style={{ color: C.amber }}>c1</span>
          </div>
        </Abs>
      )}
      {t.step >= 3 && (
        <>
          <Abs x={1020} y={560} w={760} style={{ textAlign: "center", ...rise(f, at(t, 3)) }}>
            <Big size={40} color={C.amber}>the model has run nothing</Big>
          </Abs>
          <Abs x={1020} y={660} w={760} style={{ ...card(C.green), padding: "18px 28px", fontSize: 28, ...rise(f, at(t, 3) + 50) }}>
            your code checks it, runs it, and replies
            <div style={{ fontFamily: MONO, marginTop: 8 }}>
              <span style={{ color: C.amber }}>c1</span> → 2 hours late · 1 L milk
            </div>
          </Abs>
        </>
      )}
    </>
  );
};

// ------------------------------------------------------------------ a suggestion vs a control

export const Control = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      <Abs x={140} y={260} w={760} style={{ ...rise(f, 4) }}>
        <div style={{ background: "#ffe58a", color: "#3a3000", borderRadius: 8, padding: "26px 30px", fontSize: 32, fontWeight: 700, transform: "rotate(-2deg)" }}>
          📝 in the prompt: “Only issue credits under ₹200.”
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: C.amber, marginTop: 18, textAlign: "center" }}>a suggestion</div>
      </Abs>
      <Abs x={1020} y={260} w={760} style={{ ...rise(f, 30) }}>
        <div style={{ ...card(C.green), padding: "22px 28px", fontFamily: MONO, fontSize: 28, lineHeight: 1.5 }}>
          def issue_credit(order, amount):
          <br />
          &nbsp;&nbsp;if amount &gt; 200: <span style={{ color: C.red }}>refuse</span> 🔒
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: C.green, marginTop: 18, textAlign: "center" }}>a control</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={140} y={580} w={760} style={{ ...card(C.red), padding: "20px 28px", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 26, color: C.muted }}>arguments are untrusted input</div>
          <div style={{ fontFamily: MONO, fontSize: 28, marginTop: 8 }}>order_id: "FC-1; DROP TABLE"</div>
          <div style={{ fontSize: 26, color: C.green, marginTop: 8 }}>→ validate type, range, and who owns it</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1020} y={580} w={760} style={{ ...card(C.amber), padding: "20px 28px", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 26, color: C.muted }}>errors are results too</div>
          <div style={{ fontFamily: MONO, fontSize: 28, marginTop: 8 }}>“error: orders service timed out”</div>
          <div style={{ fontSize: 26, color: C.green, marginTop: 8 }}>→ the model adapts instead of crashing</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ 25 tools vs five

export const ToolBelt = ({ t }: CP) => {
  const f = t.frame;
  const pile = ["orders_api", "get_order_info", "orders_v2", "refund_tool", "refund_api", "stock", "inventory_lookup", "check_inventory", "crm_search", "customer_db", "send_sms", "email_api", "promo_codes", "loyalty", "warehouse_ops", "routes", "driver_eta", "slots", "payments", "credits_v1", "credits_v2", "tickets", "faq_search", "policy_lookup", "admin_sql"];
  const five = [
    ["📦", "get_order"],
    ["📚", "search_policy"],
    ["🥛", "check_stock"],
    ["💸", "issue_credit", "🔒 needs approval"],
    ["🙋", "escalate_to_human"],
  ];
  const fade = from(t, 2);
  return (
    <>
      {pile.map((p, i) => (
        <Abs key={p} x={160 + (i % 5) * 330 + rnd(i) * 60} y={270 + Math.floor(i / 5) * 92 + rnd(i + 5) * 20} w={290} style={{ ...card(), padding: "10px 16px", fontFamily: MONO, fontSize: 24, color: C.muted, opacity: enter(f, 4 + i * 2) * (1 - fade), transform: `rotate(${(rnd(i + 9) - 0.5) * 8}deg) translateY(${fade * 200}px)` }}>
          {p}
        </Abs>
      ))}
      {t.step === 1 && (
        <Abs x={160} y={780} w={1600} style={{ display: "flex", gap: 20, justifyContent: "center", ...rise(f, at(t, 1)) }}>
          {["similar tools confuse the choice", "every tool costs tokens, every request", "every tool can be misused"].map((s) => (
            <Chip key={s} color={C.red} style={{ fontSize: 28, background: C.bg }}>{s}</Chip>
          ))}
        </Abs>
      )}
      {t.step >= 2 &&
        five.map(([icon, name, sub], i) => (
          <Abs key={name} x={110 + i * 345} y={400} w={320} style={{ ...card(PALETTE[i]), padding: "24px 14px", textAlign: "center", opacity: Math.min(1, pop(f, at(t, 2) + 20 + i * 10)) }}>
            <div style={{ fontSize: 64 }}>{icon}</div>
            <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, marginTop: 8 }}>{name}</div>
            {sub && <div style={{ fontSize: 22, color: C.amber, marginTop: 6 }}>{sub}</div>}
          </Abs>
        ))}
      {t.step >= 2 && (
        <Abs x={0} y={720} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 2) + 80) }}>
          <Big size={40} color={C.green}>one clear job each · tight arguments · short output</Big>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ structured output: a form, not a paragraph

export const Form = ({ t }: CP) => {
  const f = t.frame;
  const intents = ["refund", "late_delivery", "missing_item", "other"];
  const pick = t.step >= 2 ? 1 : 0;
  return (
    <>
      {t.step === 0 && (
        <div style={{ opacity: during(t, 0) }}>
          <Abs x={160} y={300} w={980} style={{ ...card(), padding: "24px 30px", fontFamily: MONO, fontSize: 30, ...rise(f, 4) }}>
            Sure! Here is the JSON: {"{"}"intent": "refund", "orderId": "FC-20931"...
          </Abs>
          <Abs x={1240} y={290} w={520} style={{ ...card(C.red), padding: "22px 28px", opacity: Math.min(1, pop(f, 60)), transform: `rotate(${Math.sin(f / 2) * (f < 80 ? 3 : 0)}deg)` }}>
            <div style={{ fontSize: 40 }}>💥 parser crashed</div>
            <div style={{ fontFamily: MONO, fontSize: 24, color: C.muted, marginTop: 8 }}>JSONDecodeError</div>
            <div style={{ fontFamily: MONO, fontSize: 24, color: C.muted }}>KeyError: 'order_id'</div>
          </Abs>
        </div>
      )}
      {t.step >= 1 && (
        <div style={{ opacity: from(t, 1) }}>
          <Abs x={360} y={270} w={1200} style={{ ...card(C.blue), padding: "26px 34px", ...rise(f, at(t, 1)) }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: C.blue }}>🧾 Ticket</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 20, flexWrap: "wrap" }}>
              <div style={{ width: 170, fontSize: 28, color: C.muted }}>intent</div>
              {intents.map((s, i) => {
                const on = i === pick && f > at(t, 1) + 30;
                const col = t.step >= 2 ? C.red : C.green;
                return (
                  <div key={s} style={{ padding: "8px 18px", borderRadius: 999, fontFamily: MONO, fontSize: 24, border: `2px solid ${on ? col : C.line}`, background: on ? `${col}22` : undefined, color: on ? col : C.muted }}>
                    {s}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18 }}>
              <div style={{ width: 170, fontSize: 28, color: C.muted }}>order_id</div>
              <div style={{ fontFamily: MONO, fontSize: 28, borderBottom: `2px solid ${C.line}`, minWidth: 300 }}>{f > at(t, 1) + 50 ? "FC-20931" : ""}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18 }}>
              <div style={{ width: 170, fontSize: 28, color: C.muted }}>urgent</div>
              <div style={{ fontSize: 30 }}>{f > at(t, 1) + 70 ? "☑ yes" : "☐"}</div>
            </div>
          </Abs>
          {t.step >= 2 && (
            <Abs x={0} y={680} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 2) + 20) }}>
              <Big size={44} color={C.amber}>perfect shape, wrong intent: valid ≠ correct</Big>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the agent loop

export const AgentLoop = ({ t }: CP) => {
  const f = t.frame;
  const cx = 640;
  const cy = 560;
  const r = 210;
  const nodes = [
    { a: -90, icon: "🤖", label: "think" },
    { a: 30, icon: "🛠️", label: "call a tool" },
    { a: 150, icon: "👀", label: "observe" },
  ];
  const spin = t.step >= 1 ? (f - at(t, 1)) / 60 : 0;
  const ang = (-90 + spin * 120) * (Math.PI / 180);
  const log = [
    ["get_order(FC-20931)", "2 h late · 1 L milk"],
    ["search_policy(spoiled dairy)", "credit up to ₹150"],
    ["answer", "“Credit ₹150; here's why…”"],
  ];
  const laps = t.step >= 1 ? Math.min(3, Math.floor(spin / 3) + 1) : 0;
  return (
    <>
      {t.step === 0 && (
        <Abs x={160} y={300} w={1600} style={{ textAlign: "center", opacity: during(t, 0) }}>
          <Big size={50}>“FC-20931 late, milk spoiled. What do I do?”</Big>
          <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 50 }}>
            {["1 · the order", "2 · the policy", "3 · maybe a credit"].map((s, i) => (
              <Chip key={s} color={PALETTE[i]} style={{ fontSize: 32, opacity: enter(f, 40 + i * 20) }}>{s}</Chip>
            ))}
          </div>
        </Abs>
      )}
      {t.step >= 1 && (
        <div style={{ opacity: from(t, 1) }}>
          <Svg>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.line} strokeWidth={4} strokeDasharray="14 12" />
            <circle cx={cx + r * Math.cos(ang)} cy={cy + r * Math.sin(ang)} r={16} fill={C.blue} />
          </Svg>
          {nodes.map((n) => {
            const x = cx + r * Math.cos((n.a * Math.PI) / 180);
            const y = cy + r * Math.sin((n.a * Math.PI) / 180);
            return (
              <Abs key={n.label} x={x - 110} y={y - 70} w={220} style={{ ...card(), padding: "12px 0", textAlign: "center" }}>
                <div style={{ fontSize: 50 }}>{n.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800 }}>{n.label}</div>
              </Abs>
            );
          })}
          <Abs x={1060} y={300} w={760}>
            {log.slice(0, laps).map(([call, res], i) => (
              <div key={call} style={{ ...card(i === 2 ? C.green : C.line), padding: "14px 22px", marginBottom: 16, ...rise(f, at(t, 1) + i * 180, 14) }}>
                <div style={{ fontFamily: MONO, fontSize: 26 }}>
                  {i + 1} · {call}
                </div>
                <div style={{ fontSize: 26, color: i === 2 ? C.green : C.muted, marginTop: 4 }}>→ {res}</div>
              </div>
            ))}
          </Abs>
          {t.step >= 2 && (
            <Abs x={1060} y={760} w={760} style={{ display: "flex", flexWrap: "wrap", gap: 14, ...rise(f, at(t, 2)) }}>
              {["a step limit", "validate before running", "errors as results", "results tied to call ids"].map((s) => (
                <Chip key={s} color={C.amber} style={{ fontSize: 26 }}>{s}</Chip>
              ))}
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ LangChain + middleware as a conveyor

export const Conveyor = ({ t }: CP) => {
  const f = t.frame;
  const extras = ["retries", "fallback model", "call limits", "streaming", "traces", "approvals", "trimming"];
  const problems = [
    ["🔁", "40 tool calls in one chat"],
    ["📧", "an email address in a trace"],
    ["🌩️", "Friday outage at the provider"],
    ["🐌", "long chats: slow and costly"],
  ];
  const stations = ["call limit", "mask personal data", "retry · fallback", "summarise"];
  const belt = t.step >= 3 ? clamp01((f - at(t, 3) - 20) / 200) : 0;
  const bx = lerp(180, 1560, belt);
  const passed = (i: number) => bx > 380 + i * 330;
  return (
    <>
      {t.step < 2 && (
        <div style={{ opacity: 1 - from(t, 2) }}>
          <Abs x={760} y={460} w={400} style={{ ...card(t.step >= 1 ? C.green : C.blue), padding: "26px 0", textAlign: "center", fontSize: 36, fontWeight: 800 }}>
            🔄 the agent loop
            {t.step >= 1 && <div style={{ fontFamily: MONO, fontSize: 28, color: C.green, marginTop: 8, ...rise(f, at(t, 1)) }}>create_agent(…)</div>}
          </Abs>
          {extras.map((e, i) => {
            const a = (i / extras.length) * Math.PI * 2 + f / 120;
            const k = t.step >= 1 ? 1 - ease(f, at(t, 1) + 10, 30) * 0.45 : 1;
            return (
              <Abs key={e} x={960 + Math.cos(a) * 520 * k - 110} y={520 + Math.sin(a) * 250 * k - 22} w={220} style={{ textAlign: "center", opacity: enter(f, 10 + i * 8) }}>
                <Chip color={PALETTE[i % PALETTE.length]} style={{ fontSize: 24 }}>{e}</Chip>
              </Abs>
            );
          })}
        </div>
      )}
      {t.step >= 2 && (
        <div style={{ opacity: from(t, 2) }}>
          {problems.map(([icon, s], i) => (
            <Abs key={s} x={110 + i * 430} y={270} w={400} style={{ ...card(passed(i) ? C.green : C.red), padding: "16px 20px", display: "flex", gap: 14, alignItems: "center", fontSize: 26, fontWeight: 700, opacity: Math.min(1, pop(f, at(t, 2) + i * 12)) }}>
              <span style={{ fontSize: 40 }}>{passed(i) ? "✅" : icon}</span>
              {s}
            </Abs>
          ))}
          {t.step >= 3 && (
            <>
              <Svg>
                <rect x={140} y={700} width={1640} height={26} rx={13} fill={C.card2} />
                {Array.from({ length: 30 }, (_, i) => (
                  <circle key={i} cx={160 + ((i * 56 + f * 2) % 1620)} cy={713} r={5} fill={C.line} />
                ))}
                {stations.map((_, i) => (
                  <line key={i} x1={530 + i * 330} y1={560} x2={530 + i * 330} y2={700} stroke={passed(i) ? C.green : C.line} strokeWidth={6} />
                ))}
              </Svg>
              {stations.map((s, i) => (
                <Abs key={s} x={420 + i * 330} y={500} w={220} style={{ ...card(passed(i) ? C.green : C.line), padding: "10px 8px", textAlign: "center", fontSize: 24, fontWeight: 700, ...rise(f, at(t, 3) + i * 8) }}>
                  {s}
                </Abs>
              ))}
              <Abs x={bx} y={630} w={150} style={{ ...card(C.blue), padding: "10px 0", textAlign: "center", fontSize: 24, fontWeight: 700 }}>request</Abs>
              <Abs x={1700} y={610} w={160} style={{ textAlign: "center", fontSize: 70 }}>🤖</Abs>
            </>
          )}
          {t.step >= 4 && (
            <Abs x={140} y={800} w={1640} style={{ display: "flex", gap: 20, justifyContent: "center", ...rise(f, at(t, 4)) }}>
              <Chip color={C.purple} style={{ fontSize: 26 }}>first in the list = outermost: logging, retries</Chip>
              <Chip color={C.purple} style={{ fontSize: 26 }}>last = right before the model: masking</Chip>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ LangGraph: a subway map with a whiteboard

export const Subway = ({ t }: CP) => {
  const f = t.frame;
  const st = [
    { id: "classify", x: 260, y: 520, field: "ticket" },
    { id: "retrieve", x: 680, y: 520, field: "chunks" },
    { id: "grade", x: 1100, y: 520, field: "relevant" },
    { id: "answer", x: 1560, y: 520, field: "messages" },
    { id: "rewrite", x: 890, y: 740, field: "tries + 1" },
  ];
  const route = [0, 1, 2, 4, 1, 2, 3];
  const go = t.step >= 1 ? clamp01((f - at(t, 1) - 30) / 260) * (route.length - 1) : 0;
  const seg = Math.min(route.length - 2, Math.floor(go));
  const a = st[route[seg]];
  const b = st[route[seg + 1]];
  const tx = lerp(a.x, b.x, go - seg);
  const ty = lerp(a.y, b.y, go - seg);
  const visited = new Set(route.slice(0, Math.floor(go) + 1));
  const rules = ["always classify first", "always search the policy", "grade the results", "retry at most twice"];
  return (
    <>
      {t.step === 0 && (
        <div style={{ opacity: during(t, 0) }}>
          <Abs x={160} y={260} w={760}>
            <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, ...rise(f, 4) }}>📋 Meera's rules</div>
            {rules.map((r, i) => (
              <div key={r} style={{ ...card(C.amber), padding: "14px 22px", fontSize: 30, fontWeight: 700, marginBottom: 14, ...rise(f, 14 + i * 10) }}>
                {r}
              </div>
            ))}
          </Abs>
          <Abs x={1000} y={400} w={760} style={{ ...rise(f, 70) }}>
            <Big size={46} color={C.amber}>can a loop where the model decides everything promise this?</Big>
          </Abs>
        </div>
      )}
      {t.step >= 1 && (
        <div style={{ opacity: from(t, 1) }}>
          <Svg>
            {[
              [0, 1],
              [1, 2],
              [2, 3],
              [2, 4],
              [4, 1],
            ].map(([i, j], k) => (
              <line key={k} x1={st[i].x} y1={st[i].y} x2={st[j].x} y2={st[j].y} stroke={[C.blue, C.blue, C.green, C.red, C.red][k]} strokeWidth={12} strokeLinecap="round" opacity={ease(f, at(t, 1) + k * 6, 14)} />
            ))}
            {st.map((s) => (
              <circle key={s.id} cx={s.x} cy={s.y} r={24} fill={C.bg} stroke={visited.has(st.indexOf(s)) ? C.green : C.text} strokeWidth={8} />
            ))}
            <rect x={tx - 26} y={ty - 16} width={52} height={32} rx={10} fill={C.amber} />
          </Svg>
          {st.map((s) => (
            <Abs key={s.id} x={s.x - 120} y={s.id === "rewrite" ? s.y + 36 : s.y - 92} w={240} style={{ textAlign: "center", fontSize: 32, fontWeight: 800 }}>
              {s.id}
            </Abs>
          ))}
          <Abs x={1140} y={680} w={240} style={{ fontSize: 24, color: C.red, fontWeight: 700 }}>weak, tries &lt; 2</Abs>
          {t.step >= 2 && (
            <Abs x={120} y={760} w={600} style={{ ...card(C.purple), padding: "16px 22px", ...rise(f, at(t, 2)) }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: C.purple }}>🧑‍🏫 the whiteboard (state)</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                {st.map((s, i) => (
                  <span key={s.id} style={{ fontFamily: MONO, fontSize: 22, padding: "4px 10px", borderRadius: 8, border: `2px solid ${visited.has(i) ? C.green : C.line}`, color: visited.has(i) ? C.text : C.faint }}>
                    {s.field}
                  </span>
                ))}
              </div>
            </Abs>
          )}
          {t.step >= 3 && (
            <Abs x={1100} y={830} w={720} style={{ ...rise(f, at(t, 3)) }}>
              <Chip color={C.green} style={{ fontSize: 28 }}>no path skips the policy search</Chip>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ super-steps: rounds, merged and saved

export const SuperStep = ({ t }: CP) => {
  const f = t.frame;
  const run = t.step >= 1 ? clamp01((f - at(t, 1) - 10) / 60) : 0;
  return (
    <>
      <Abs x={120} y={300} w={800} style={{ ...card(t.step === 1 ? C.blue : C.line), padding: "22px 26px", ...rise(f, 4) }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.blue }}>round 1</div>
        <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
          {["search_policy", "get_order"].map((n, i) => (
            <div key={n} style={{ flex: 1, ...card(), padding: "16px 18px" }}>
              <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700 }}>{n}</div>
              <div style={{ height: 12, borderRadius: 6, background: C.card2, marginTop: 14 }}>
                <div style={{ height: 12, borderRadius: 6, width: `${Math.min(1, run * (i ? 1.3 : 1)) * 100}%`, background: PALETTE[i] }} />
              </div>
            </div>
          ))}
        </div>
        {t.step >= 1 && <div style={{ fontSize: 24, color: C.muted, marginTop: 14, ...rise(f, at(t, 1) + 40) }}>side by side · neither sees the other's update</div>}
      </Abs>
      {t.step >= 2 && (
        <>
          <Svg>
            <Arrow x1={940} y1={420} x2={1030} y2={420} p={ease(f, at(t, 2), 12)} />
            <Arrow x1={1180} y1={480} x2={1180} y2={560} p={ease(f, at(t, 2) + 30, 12)} />
            <Arrow x1={1340} y1={620} x2={1420} y2={620} p={ease(f, at(t, 2) + 60, 12)} />
          </Svg>
          <Abs x={1040} y={370} w={300} style={{ ...card(C.amber), padding: "16px 0", textAlign: "center", fontSize: 28, fontWeight: 800, ...rise(f, at(t, 2) + 6) }}>merge updates</Abs>
          <Abs x={1040} y={570} w={300} style={{ ...card(C.purple), padding: "16px 0", textAlign: "center", fontSize: 28, fontWeight: 800, ...rise(f, at(t, 2) + 36) }}>💾 save state</Abs>
          <Abs x={1430} y={570} w={330} style={{ ...card(C.green), padding: "16px 0", textAlign: "center", fontSize: 28, fontWeight: 800, ...rise(f, at(t, 2) + 66) }}>round 2: answer</Abs>
        </>
      )}
      {t.step >= 3 && (
        <Abs x={120} y={760} w={1680} style={{ display: "flex", gap: 20, flexWrap: "wrap", ...rise(f, at(t, 3)) }}>
          <Chip color={C.red} style={{ fontSize: 26 }}>two nodes, one field, no reducer → InvalidUpdateError</Chip>
          <Chip color={C.amber} style={{ fontSize: 26 }}>recursion_limit caps the rounds</Chip>
        </Abs>
      )}
    </>
  );
};
