// The Inventory Ops Agent lecture (IOA-01): a check-yourself quiz card, an
// analogy mapper, and one picture per mechanism (middleware stack, the retry
// trap, reducers, hierarchy, Base + Overlay, UPSERT, the two-turn approval,
// Redis staging, the SSE stream). Boards reuse LLArch from ll01.tsx.
import { Fragment, type ReactNode } from "react";
import { interpolate } from "remotion";
import { C, MONO, tone } from "../lib/theme.ts";
import { ease, enter, lerp, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at } from "./custom3.tsx";
import type { CP } from "./secui.tsx";

const Title = ({ text, f, sub }: { text: string; f: number; sub?: string }) => (
  <Abs x={80} y={124} w={1760} style={rise(f, 2)}>
    <div style={{ fontFamily: C.head, fontSize: text.length > 48 ? 40 : 46, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15 }}>{text}</div>
    {sub && <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>{sub}</div>}
  </Abs>
);

const Ring = ({ f, from, to, size = 92 }: { f: number; from: number; to: number; size?: number }) => {
  const hp = interpolate(f, [from, Math.max(from + 1, to)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const r = size / 2 - 6;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={C.line} strokeWidth={7} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={C.amber} strokeWidth={7} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={hp} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
};

const Mono = ({ children, color, size = 24 }: { children: ReactNode; color?: string; size?: number }) => <span style={{ fontFamily: MONO, fontSize: size, color: color ?? C.text }}>{children}</span>;

// ------------------------------------------------------------------ check yourself

// Beat 0 asks (give it a hold: the ring counts the thinking time down), beat 1
// reveals the answer, beat 2 (optional) adds the why.
export const IoaCheck = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { n: number; topic: string; q: string; options?: string[]; answer?: number; a: string; why?: string };
  const opts = p.options ?? [];
  const answered = t.step >= 1;
  const qb = t.beats[0];
  const thinking = !answered && qb && f > qb.audioEnd;
  const qSize = p.q.length > 110 ? 40 : p.q.length > 70 ? 46 : 52;
  const optTop = 380;
  const rowsN = Math.ceil(opts.length / 2);
  const optH = 104;
  const ansTop = opts.length ? optTop + rowsN * (optH + 20) + 14 : 420;
  return (
    <>
      <Abs x={80} y={128} w={1760} style={{ display: "flex", alignItems: "center", gap: 22, ...rise(f, 2) }}>
        <Chip color={C.amber}>✋ CHECK YOURSELF</Chip>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.muted }}>
          {p.n ? `Check ${p.n} · ` : ""}
          {p.topic}
        </div>
      </Abs>
      <Abs x={140} y={220} w={1640} style={{ display: "flex", gap: 30, alignItems: "flex-start", ...rise(f, 6, 28) }}>
        <div style={{ fontSize: 60, fontWeight: 900, color: C.amber, lineHeight: 1 }}>Q</div>
        <div style={{ fontSize: qSize, fontWeight: 800, lineHeight: 1.22 }}>{p.q}</div>
      </Abs>
      {opts.length > 0 && (
        <Abs x={140} y={optTop} w={1640} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {opts.map((o, i) => {
            const right = i === p.answer;
            const col = answered && right ? C.green : C.line;
            return (
              <div key={i} style={{ ...card(col), height: optH, padding: "0 26px", display: "flex", alignItems: "center", gap: 22, opacity: (answered && !right ? 0.32 : 1) * enter(f, 14 + i * 6, 12), boxSizing: "border-box" }}>
                <div style={{ width: 54, height: 54, borderRadius: 14, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 900, background: answered && right ? C.green : C.card2, color: answered && right ? C.bg : C.muted }}>
                  {answered && right ? "✓" : "ABCD"[i]}
                </div>
                <div style={{ fontSize: o.length > 60 ? 26 : 30, fontWeight: 650, lineHeight: 1.25 }}>{o}</div>
              </div>
            );
          })}
        </Abs>
      )}
      {thinking && (
        <Abs x={140} y={ansTop} w={1200} style={{ display: "flex", alignItems: "center", gap: 26, opacity: enter(f, qb.audioEnd, 8) }}>
          <Ring f={f} from={qb.audioEnd} to={qb.end} />
          <div>
            <div style={{ fontSize: 36, fontWeight: 800, color: C.amber }}>Pause and answer it out loud</div>
            <div style={{ fontSize: 26, color: C.muted, marginTop: 4 }}>say the reason too, not just the word</div>
          </div>
        </Abs>
      )}
      {answered && (
        <Abs x={140} y={ansTop} w={1640} style={{ ...card(C.green), padding: "24px 34px", display: "flex", gap: 28, alignItems: "flex-start", ...rise(f, at(t, 1), 22) }}>
          <div style={{ fontSize: 46, fontWeight: 900, color: C.green, lineHeight: 1 }}>A</div>
          <div>
            <div style={{ fontSize: p.a.length > 110 ? 30 : 34, lineHeight: 1.36, fontWeight: 600 }}>{p.a}</div>
            {p.why && t.step >= 2 && <div style={{ fontSize: 26, lineHeight: 1.4, color: C.muted, marginTop: 14, ...rise(f, at(t, 2), 14) }}>{p.why}</div>}
          </div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ analogy mapper

// Something familiar on the left, the system on the right, one row per beat.
// Beat 0 sets up the two headers; beat i shows row i - 1; a last beat the footer.
export const IoaMap = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { title: string; a: string; b: string; rows: { icon: string; a: string; b: string }[]; footer?: string };
  const n = p.rows.length;
  const room = (p.footer ? 800 : 870) - 316;
  // rows fill the stage, leaving room for the footer chip when there is one;
  // a short list sits in the middle of that room
  const rh = Math.min(118, Math.floor(room / n));
  const top = 316 + Math.max(0, (room - rh * n) / 2 - 40);
  return (
    <>
      <Title text={p.title} f={f} />
      <Abs x={120} y={top - 84} w={760} style={{ fontSize: 30, fontWeight: 800, color: C.amber, ...rise(f, 4) }}>
        {p.a}
      </Abs>
      <Abs x={1040} y={top - 84} w={760} style={{ fontSize: 30, fontWeight: 800, color: C.blue, ...rise(f, 8) }}>
        {p.b}
      </Abs>
      {p.rows.map((r, i) => {
        const st = i + 1;
        if (t.step < st) return null;
        const cur = t.step === st;
        const y = top + i * rh;
        const o = cur || t.step > n ? 1 : 0.62;
        return (
          <div key={i} style={{ opacity: o }}>
            <Abs x={120} y={y} w={780} h={rh - 16} style={{ ...card(cur ? C.amber : undefined), padding: "0 24px", display: "flex", alignItems: "center", gap: 20, boxSizing: "border-box", ...rise(f, at(t, st), 18) }}>
              <div style={{ fontSize: rh > 100 ? 46 : 38, flex: "none" }}>{r.icon}</div>
              <div style={{ fontSize: r.a.length > 52 ? 25 : 29, fontWeight: 650, lineHeight: 1.25 }}>{r.a}</div>
            </Abs>
            <Abs x={912} y={y + (rh - 16) / 2 - 24} w={116} style={{ textAlign: "center", fontSize: 40, color: cur ? C.text : C.faint, ...rise(f, at(t, st) + 6, 10) }}>
              ⟶
            </Abs>
            <Abs x={1040} y={y} w={760} h={rh - 16} style={{ ...card(cur ? C.blue : undefined), padding: "0 24px", display: "flex", alignItems: "center", boxSizing: "border-box", ...rise(f, at(t, st) + 8, 18) }}>
              <div style={{ fontFamily: MONO, fontSize: r.b.length > 44 ? 23 : 26, fontWeight: 600, lineHeight: 1.3 }}>{r.b}</div>
            </Abs>
          </div>
        );
      })}
      {p.footer && t.step > n && (
        <Abs x={120} y={820} w={1680} style={{ textAlign: "center", ...rise(f, at(t, n + 1)) }}>
          <Chip color={C.green} style={{ fontSize: 28 }}>
            {p.footer}
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ middleware stack

type Layer = { name: string; g: number };
type StackStep = { g?: number; layers?: number[]; t?: string; b?: string };

// The supervisor's twelve layers, top to bottom, the model call underneath.
// Each step lights a group (or a list of layers) and explains it on the right.
export const IoaStack = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { layers: Layer[]; groups: { name: string; tone: string }[]; steps: StackStep[] };
  const st = p.steps[Math.min(t.step, p.steps.length - 1)] ?? {};
  const lit = (i: number) => (st.layers ? st.layers.includes(i) : st.g != null ? p.layers[i].g === st.g : true);
  const y0 = 196;
  const h = 46;
  const gap = 6;
  const travel = t.step === 0 ? ease(f, 40, 150) : 1;
  const bottom = y0 + p.layers.length * (h + gap);
  // the panel shows the latest step with text
  let pi = Math.min(t.step, p.steps.length - 1);
  while (pi > 0 && !p.steps[pi]?.t) pi--;
  const ps = p.steps[pi];
  const gcol = ps?.g != null ? tone(p.groups[ps.g].tone) : C.blue;
  return (
    <>
      <Abs x={100} y={134} w={880} style={{ fontSize: 26, color: C.muted, ...rise(f, 2) }}>
        ▼ every model call and every tool call passes through, in this order
      </Abs>
      {p.layers.map((l, i) => {
        const on = lit(i);
        const col = tone(p.groups[l.g].tone);
        return (
          <Abs key={i} x={100} y={y0 + i * (h + gap)} w={880} h={h} style={{ display: "flex", alignItems: "center", gap: 16, borderRadius: 12, padding: "0 18px", boxSizing: "border-box", background: on && t.step > 0 ? `${col}26` : C.card, border: `2px solid ${on && t.step > 0 ? col : C.line}`, opacity: (t.step === 0 ? 1 : on ? 1 : 0.38) * enter(f, 6 + i * 3, 10) }}>
            <div style={{ width: 10, height: 26, borderRadius: 4, background: col, flex: "none" }} />
            <div style={{ fontFamily: MONO, fontSize: 20, color: C.muted, width: 30 }}>{i + 1}</div>
            <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 650, whiteSpace: "nowrap" }}>{l.name}</div>
          </Abs>
        );
      })}
      <Abs x={100} y={bottom + 8} w={880} h={58} style={{ ...card(C.green), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, opacity: enter(f, 40, 12) }}>
        🧠 the model call · 🛠 the tool call
      </Abs>
      {t.step === 0 && travel < 1 && (
        <div style={{ position: "absolute", left: 1000, top: lerp(y0, bottom + 10, travel), width: 24, height: 24, borderRadius: 12, background: C.amber, boxShadow: `0 0 20px ${C.amber}` }} />
      )}
      {ps?.t && (
        <Abs key={ps.t} x={1060} y={210} w={780} style={rise(f, at(t, p.steps.findIndex((x) => x.t === ps.t)), 18)}>
          {ps.g != null && <Chip color={gcol}>{p.groups[ps.g].name}</Chip>}
          <div style={{ fontFamily: C.head, fontSize: 40, fontWeight: 800, lineHeight: 1.15, marginTop: 18 }}>{ps.t}</div>
          {ps.b && <div style={{ fontSize: 29, lineHeight: 1.45, color: "#c9d1de", marginTop: 16, whiteSpace: "pre-line" }}>{ps.b}</div>}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the retry trap

// Nested layers around a write. Steps: 0 the stack, 1 the interrupt is raised,
// 2 a retry around task() catches it, 3 the real design lets it through, 4 the lesson.
export const IoaRetry = ({ t }: CP) => {
  const f = t.frame;
  const s = t.step;
  const Doll = ({ x, y, w, h, label, col, dash, children, o = 1 }: { x: number; y: number; w: number; h: number; label: string; col?: string; dash?: boolean; children?: ReactNode; o?: number }) => (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 18, border: `2.5px ${dash ? "dashed" : "solid"} ${col ?? C.line}`, background: `${C.card}cc`, boxSizing: "border-box", opacity: o }}>
      <div style={{ position: "absolute", left: 18, top: 10, fontFamily: MONO, fontSize: 23, fontWeight: 700, color: col ?? C.muted }}>{label}</div>
      {children}
    </div>
  );
  const Token = ({ x, y, ok }: { x: number; y: number; ok?: boolean }) => (
    <div style={{ position: "absolute", left: x, top: y, padding: "8px 16px", borderRadius: 999, background: ok ? C.green : C.amber, color: C.bg, fontFamily: MONO, fontSize: 22, fontWeight: 800, boxShadow: `0 0 24px ${ok ? C.green : C.amber}`, whiteSpace: "nowrap" }}>
      ⏸ GraphInterrupt
    </div>
  );
  // left panel (the stack; at step 2 it becomes the broken version)
  const L = { x: 90, y: 240, w: 820, h: 560 };
  const leftTitle = s >= 2 ? "❌ if retry wrapped task()" : "the layers around one write";
  const rise1 = s === 1 ? ease(f, at(t, 1) + 10, 70) : s >= 2 ? 1 : 0;
  const tokL = s >= 1 && s <= 2;
  const tokY = lerp(L.y + 380, L.y + 66, rise1);
  const caught = s >= 2;
  const loops = s >= 2 ? Math.min(2, Math.floor((f - at(t, 2)) / 45)) : 0;
  const R = { x: 1010, y: 240, w: 820, h: 560 };
  const up = s >= 3 ? ease(f, at(t, 3) + 14, 80) : 0;
  return (
    <>
      <Title text="Why task() is never retried" f={f} />
      <Abs x={L.x} y={L.y - 52} w={L.w} style={{ fontSize: 30, fontWeight: 800, color: s >= 2 ? C.red : C.text }}>
        {leftTitle}
      </Abs>
      <Doll x={L.x} y={L.y} w={L.w} h={L.h} label="supervisor graph">
        <Doll x={30} y={60} w={L.w - 60} h={L.h - 90} label="ToolRetryMiddleware ⟲" col={C.amber} dash>
          <Doll x={30} y={60} w={L.w - 120} h={L.h - 180} label="task() → replenishment subagent" col={C.blue}>
            <Doll x={30} y={70} w={L.w - 180} h={L.h - 290} label="update_parameters" col={C.green}>
              <div style={{ position: "absolute", left: 18, top: 56, fontSize: 24, color: C.muted, lineHeight: 1.4 }}>
                HITL middleware: interrupt_on
                <br />
                the tool body has not run yet
              </div>
            </Doll>
          </Doll>
        </Doll>
      </Doll>
      {tokL && <Token x={L.x + 380} y={caught ? L.y + 66 : tokY} />}
      {caught && (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <path d={`M ${L.x + 620} ${L.y + 88} C ${L.x + 780} ${L.y + 88}, ${L.x + 780} ${L.y + 300}, ${L.x + 650} ${L.y + 300}`} stroke={C.red} strokeWidth={4} fill="none" strokeDasharray="10 8" strokeDashoffset={-(f % 36)} opacity={enter(f, at(t, 2) + 8, 12)} />
          </svg>
          <Abs x={L.x + 120} y={L.y + 340} w={560} style={{ fontSize: 25, fontWeight: 800, color: C.red, opacity: enter(f, at(t, 2) + 12, 10) }}>
            caught as an error · {loops < 2 ? `retry ${loops + 1} of 2` : "retries used up"}
          </Abs>
          <Abs x={L.x} y={L.y + L.h + 14} w={L.w} style={{ fontSize: 27, fontWeight: 700, color: C.red, textAlign: "center", opacity: enter(f, at(t, 2) + 80, 12) }}>
            the approval request never reaches the planner
          </Abs>
        </>
      )}
      {s >= 3 && (
        <>
          <Abs x={R.x} y={R.y - 52} w={R.w} style={{ fontSize: 30, fontWeight: 800, color: C.green, ...rise(f, at(t, 3)) }}>
            ✅ the real design: task() is excluded
          </Abs>
          <div style={rise(f, at(t, 3), 20)}>
            <Doll x={R.x} y={R.y} w={R.w} h={R.h} label="supervisor graph">
              <Doll x={30} y={60} w={330} h={220} label="ToolRetryMiddleware" col={C.amber} dash>
                <div style={{ position: "absolute", left: 18, top: 60, fontSize: 24, color: C.muted, lineHeight: 1.45 }}>
                  wraps only the direct tools:
                  <br />
                  insights link · forecast
                </div>
              </Doll>
              <Doll x={390} y={60} w={400} h={470} label="task() · not retried" col={C.blue}>
                <Doll x={24} y={70} w={352} h={260} label="update_parameters" col={C.green}>
                  <div style={{ position: "absolute", left: 18, top: 56, fontSize: 23, color: C.muted, lineHeight: 1.4 }}>
                    HITL raises
                    <br />
                    GraphInterrupt
                  </div>
                </Doll>
              </Doll>
            </Doll>
          </div>
          <Token x={R.x + 440} y={lerp(R.y + 300, R.y - 4, up)} ok={up > 0.98} />
          {up > 0.98 && (
            <Abs x={R.x + 30} y={R.y + 330} w={340} style={{ ...card(C.green), padding: "16px 20px", fontSize: 25, lineHeight: 1.4, ...rise(f, at(t, 3) + 96, 14) }}>
              state saved
              <br />
              planner sees:
              <br />
              <b>Approve · Reject</b>
            </Abs>
          )}
        </>
      )}
      {s >= 4 && (
        <Abs x={80} y={852} w={1760} style={{ textAlign: "center", ...rise(f, at(t, 4)) }}>
          <Chip color={C.green} style={{ fontSize: 28 }}>
            retries are for failures · an interrupt is control flow
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ reducers

// The graph state as a whiteboard with four columns, each with its own rule
// for merging an update. Steps: 0 board, 1 append, 2 identity locked, 3 per-turn
// replaced, 4 two subagents at once, 5 without a reducer, 6 tools read from state.
export const IoaState = ({ t }: CP) => {
  const f = t.frame;
  const s = t.step;
  const colW = 410;
  const xs = [90, 530, 970, 1410];
  const top = 300;
  const Col = ({ i, title, rule, col, children }: { i: number; title: string; rule: string; col: string; children: ReactNode }) => {
    const focus = s === 0 || s === 6 || (s >= 1 && s <= 3 ? s - 1 === i : i === 3);
    return (
      <Abs x={xs[i]} y={top} w={colW} h={560} style={{ ...card(focus && s > 0 ? col : undefined), padding: "18px 20px", boxSizing: "border-box", opacity: (focus ? 1 : 0.4) * enter(f, 6 + i * 6, 12) }}>
        <div style={{ fontFamily: MONO, fontSize: 25, fontWeight: 800 }}>{title}</div>
        <div style={{ marginTop: 8 }}>
          <Chip color={col} style={{ fontSize: 20, padding: "4px 12px" }}>
            {rule}
          </Chip>
        </div>
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
      </Abs>
    );
  };
  const Item = ({ children, col, o = 1, strike, st }: { children: ReactNode; col?: string; o?: number; strike?: boolean; st?: number }) => (
    <div style={{ fontFamily: MONO, fontSize: 21, lineHeight: 1.3, padding: "8px 12px", borderRadius: 10, background: C.card2, border: `1.5px solid ${col ?? C.line}`, opacity: o * (st != null ? enter(f, st, 12) : 1), textDecoration: strike ? "line-through" : undefined, color: strike ? C.red : C.text }}>
      {children}
    </div>
  );
  return (
    <>
      <Title text="Graph state: one whiteboard, four rules" f={f} sub="a reducer is the rule for merging an update into a field: (old, update) → new" />
      <Col i={0} title="messages" rule="add_messages · append" col={C.blue}>
        <Item>👤 show BBO params for Milk, West</Item>
        <Item>🤖 9 rows: ordering cost 10 …</Item>
        {s >= 1 && <Item col={C.blue} st={at(t, 1) + 10}>👤 set ordering cost to 12 ＋</Item>}
      </Col>
      <Col i={1} title="identity" rule="keep-identity · set once" col={C.purple}>
        <Item>conversation_id: c-81f</Item>
        <Item>user_id: u-17</Item>
        <Item>realm: …</Item>
        {s >= 2 && (
          <Item col={C.red} strike st={at(t, 2) + 10}>
            user_id: u-99 ✗
          </Item>
        )}
        {s >= 2 && <div style={{ fontSize: 22, color: C.purple, fontWeight: 700, opacity: enter(f, at(t, 2) + 30, 10) }}>🔒 can't change inside a conversation</div>}
      </Col>
      <Col i={2} title="per-turn" rule="last value wins" col={C.amber}>
        <Item o={s >= 3 ? 0.35 : 1} strike={s >= 3}>
          current_view: BBO params
        </Item>
        {s >= 3 && (
          <Item col={C.amber} st={at(t, 3) + 10}>
            current_view: Allocation
          </Item>
        )}
        <Item>planning_instance_id: pi-03</Item>
        <Item col={s >= 6 ? C.green : undefined}>base_scenario_id: s-42</Item>
        <div style={{ fontSize: 21, color: C.muted }}>refreshed from the request every turn</div>
      </Col>
      <Col i={3} title="subagent_memory" rule="merge · own bucket" col={C.green}>
        <Item col={s >= 4 && s !== 5 ? C.green : undefined} strike={s === 5}>
          allocation: {"{ … }"}
        </Item>
        <Item col={s >= 4 ? C.green : undefined}>replenishment: {"{ … }"}</Item>
        {s === 4 && <div style={{ fontSize: 22, color: C.green, fontWeight: 700, opacity: enter(f, at(t, 4) + 20, 10) }}>two writes at once → both buckets kept</div>}
        {s === 5 && <div style={{ fontSize: 22, color: C.red, fontWeight: 700, opacity: enter(f, at(t, 5) + 10, 10) }}>no reducer: last writer wins → allocation's work silently lost</div>}
      </Col>
      {s >= 6 && (
        <Abs x={90} y={top + 580} w={1730} style={{ textAlign: "center", ...rise(f, at(t, 6)) }}>
          <Chip color={C.green} style={{ fontSize: 27 }}>
            tools read the scenario with AgentContext.from_state(...) · never from the model's arguments
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ hierarchy

// Item and location trees; a planner's sentence lights a class and a region,
// and the cross product is the set of fact rows. Steps: 0 trees, 1 class,
// 2 region, 3 the rows, 4 level → column differs per instance.
export const IoaTree = ({ t }: CP) => {
  const f = t.frame;
  const s = t.step;
  type TN = { id: string; t: string; x: number; y: number; p?: string; on?: number };
  const item: TN[] = [
    { id: "d", t: "Dairy", x: 460, y: 262 },
    { id: "milk", t: "Milk", x: 230, y: 372, p: "d", on: 1 },
    { id: "cheese", t: "Cheese", x: 460, y: 372, p: "d" },
    { id: "yog", t: "Yogurt", x: 690, y: 372, p: "d" },
    { id: "m1", t: "Milk 1L", x: 110, y: 482, p: "milk", on: 1 },
    { id: "m2", t: "Milk 2L", x: 250, y: 482, p: "milk", on: 1 },
    { id: "m3", t: "Organic 1L", x: 395, y: 482, p: "milk", on: 1 },
    { id: "c1", t: "Cheddar", x: 545, y: 482, p: "cheese" },
    { id: "y1", t: "Greek", x: 690, y: 482, p: "yog" },
  ];
  const loc: TN[] = [
    { id: "all", t: "All locations", x: 1440, y: 262 },
    { id: "west", t: "West", x: 1230, y: 372, p: "all", on: 2 },
    { id: "east", t: "East", x: 1650, y: 372, p: "all" },
    { id: "w1", t: "West DC-1", x: 1080, y: 482, p: "west", on: 2 },
    { id: "w2", t: "West DC-2", x: 1230, y: 482, p: "west", on: 2 },
    { id: "w3", t: "West DC-3", x: 1380, y: 482, p: "west", on: 2 },
    { id: "e1", t: "East DC-1", x: 1570, y: 482, p: "east" },
    { id: "e2", t: "East DC-2", x: 1730, y: 482, p: "east" },
  ];
  const draw = (nodes: TN[], key: string) => {
    const by = Object.fromEntries(nodes.map((n) => [n.id, n]));
    return (
      <>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {nodes
            .filter((n) => n.p)
            .map((n) => {
              const pa = by[n.p!];
              const on = n.on != null && s >= n.on;
              return <path key={`${key}${n.id}`} d={`M ${pa.x} ${pa.y + 26} C ${pa.x} ${pa.y + 70}, ${n.x} ${n.y - 60}, ${n.x} ${n.y - 26}`} stroke={on ? C.blue : C.line} strokeWidth={on ? 3.5 : 2} fill="none" opacity={enter(f, 10, 14)} />;
            })}
        </svg>
        {nodes.map((n) => {
          const on = n.on != null && s >= n.on;
          const leaf = n.y > 450;
          return (
            <Abs key={`${key}${n.id}n`} x={n.x - (leaf ? 68 : 90)} y={n.y - 26} w={leaf ? 136 : 180} h={52} style={{ borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: leaf ? 20 : 25, fontWeight: 700, background: on ? `${C.blue}30` : C.card, border: `2px solid ${on ? C.blue : C.line}`, opacity: enter(f, 6, 12) * (s >= 1 && !on && s < 4 ? 0.5 : 1), whiteSpace: "nowrap" }}>
              {n.t}
            </Abs>
          );
        })}
      </>
    );
  };
  const items = ["Milk 1L", "Milk 2L", "Organic 1L"];
  const dcs = ["West DC-1", "West DC-2", "West DC-3"];
  return (
    <>
      <Title text="“The Milk class in the West”: a hierarchy question" f={f} />
      <Abs x={110} y={196} w={700} style={{ fontSize: 24, color: C.muted, ...rise(f, 4) }}>
        item levels: department → class → item
      </Abs>
      <Abs x={1080} y={196} w={760} style={{ fontSize: 24, color: C.muted, ...rise(f, 4) }}>
        location levels: region → DC
      </Abs>
      {draw(item, "i")}
      {draw(loc, "l")}
      {s >= 3 && (
        <Abs x={300} y={560} w={1320} style={{ ...card(C.blue), padding: "14px 24px", ...rise(f, at(t, 3)) }}>
          <div style={{ display: "grid", gridTemplateColumns: "190px repeat(3, 1fr)", gap: 8, fontFamily: MONO, fontSize: 21 }}>
            <div />
            {dcs.map((d) => (
              <div key={d} style={{ color: C.muted, textAlign: "center" }}>
                {d}
              </div>
            ))}
            {items.map((it, r) => (
              <Fragment key={it}>
                <div style={{ color: C.muted }}>
                  {it}
                </div>
                {dcs.map((d, c) => (
                  <div key={it + d} style={{ textAlign: "center", padding: "5px 0", borderRadius: 8, background: `${C.blue}30`, opacity: enter(f, at(t, 3) + 8 + (r * 3 + c) * 4, 8) }}>
                    row
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 25, fontWeight: 700, textAlign: "center" }}>one sentence → 3 items × 3 DCs = 9 item-location rows</div>
        </Abs>
      )}
      {s >= 4 && (
        <Abs x={200} y={808} w={1520} style={{ textAlign: "center", ...rise(f, at(t, 4)) }}>
          <Chip color={C.amber} style={{ fontSize: 25 }}>
            the column for “class” or “region” differs per instance → a level → column map, per instance
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ Base + Overlay

// Steps: 0 Base, 1 planner A's approved edit lands in the overlay, 2 A's view,
// 3 B's view, 4 undo, 5 the analogy.
export const IoaOverlay = ({ t }: CP) => {
  const f = t.frame;
  const s = t.step;
  const rows = [
    ["Milk 1L", "West DC-1", 10, 40],
    ["Milk 2L", "West DC-1", 10, 35],
    ["Organic 1L", "West DC-2", 14, 20],
  ] as const;
  const Cell = ({ children, hl, w, mono = true }: { children: ReactNode; hl?: string; w: number; mono?: boolean }) => (
    <div style={{ width: w, padding: "8px 10px", fontFamily: mono ? MONO : undefined, fontSize: 21, borderRadius: 8, background: hl ? `${hl}33` : "transparent", border: hl ? `1.5px solid ${hl}` : "1.5px solid transparent", whiteSpace: "nowrap", boxSizing: "border-box" }}>{children}</div>
  );
  const Table = ({ x, y, w, title, sub, col, children, o = 1 }: { x: number; y: number; w: number; title: string; sub: string; col?: string; children: ReactNode; o?: number }) => (
    <Abs x={x} y={y} w={w} style={{ ...card(col), padding: "16px 20px", opacity: o }}>
      <div style={{ fontFamily: MONO, fontSize: 25, fontWeight: 800 }}>{title}</div>
      <div style={{ fontSize: 21, color: C.muted, marginTop: 2, marginBottom: 10 }}>{sub}</div>
      {children}
    </Abs>
  );
  const head = (cols: [string, number][]) => (
    <div style={{ display: "flex", gap: 4, color: C.muted }}>
      {cols.map(([c, w]) => (
        <Cell key={c} w={w}>
          {c}
        </Cell>
      ))}
    </div>
  );
  const overlayOn = s >= 1 && s < 4;
  const view = (who: "A" | "B") => {
    const mine = who === "A" && overlayOn;
    return rows.map((r, i) => (
      <div key={i} style={{ display: "flex", gap: 4 }}>
        <Cell w={150}>{r[0]}</Cell>
        <Cell w={140}>{r[1]}</Cell>
        <Cell w={110} hl={i === 0 && mine ? C.green : undefined}>
          {i === 0 && mine ? 12 : r[2]}
        </Cell>
      </div>
    ));
  };
  return (
    <>
      <Title text="Base + Overlay: edits on tracing paper" f={f} />
      <Table x={80} y={210} w={830} title="Base · the shared plan" sub="read through VIEWs · the agent never writes it 🔒" col={s === 0 ? C.blue : undefined}>
        {head([["item", 150], ["location", 140], ["ordering cost", 180], ["safety stock", 170]])}
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 4 }}>
            <Cell w={150}>{r[0]}</Cell>
            <Cell w={140}>{r[1]}</Cell>
            <Cell w={180}>{r[2]}</Cell>
            <Cell w={170}>{r[3]}</Cell>
          </div>
        ))}
      </Table>
      {s >= 1 && (
        <Table x={960} y={210} w={880} title="<kind>_u · the overlay" sub="one row per edited item-location, per (user, scenario)" col={overlayOn ? C.green : C.line} o={enter(f, at(t, 1), 14)}>
          {head([["item", 130], ["location", 140], ["cost", 90], ["ip__user_id", 170], ["ip__scenario_id", 210]])}
          <div style={{ display: "flex", gap: 4, opacity: s >= 4 ? 1 - enter(f, at(t, 4) + 10, 16) * 0.85 : enter(f, at(t, 1) + 14, 12), textDecoration: s >= 4 ? "line-through" : undefined }}>
            <Cell w={130}>Milk 1L</Cell>
            <Cell w={140}>West DC-1</Cell>
            <Cell w={90} hl={C.green}>
              12
            </Cell>
            <Cell w={170}>u-17 (A)</Cell>
            <Cell w={210}>s-42</Cell>
          </div>
          <div style={{ fontSize: 20, color: C.muted, marginTop: 8 }}>+ ip__status = 1 · ip__last_modified = now (UTC)</div>
        </Table>
      )}
      {s >= 2 && (
        <Table x={80} y={540} w={830} title="Planner A sees (scenario s-42)" sub="Base with A's overlay laid on top" col={s === 2 || s === 4 ? C.green : undefined} o={enter(f, at(t, 2), 14)}>
          {head([["item", 150], ["location", 140], ["ordering cost", 110]])}
          {view("A")}
        </Table>
      )}
      {s >= 3 && (
        <Table x={960} y={540} w={880} title="Planner B sees (their own scenario)" sub="Base only: A's edit is not in B's layer" col={s === 3 ? C.amber : undefined} o={enter(f, at(t, 3), 14)}>
          {head([["item", 150], ["location", 140], ["ordering cost", 110]])}
          {view("B")}
        </Table>
      )}
      {s >= 5 && (
        <Abs x={80} y={862} w={1760} style={{ textAlign: "center", ...rise(f, at(t, 5)) }}>
          <Chip color={C.blue} style={{ fontSize: 26 }}>
            tracing paper over a printed map · copy-on-write · a git branch over a shared main
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ UPSERT

// Steps: 0 the empty table and its conflict key, 1 insert, 2 the same approval
// again, 3 a new value, 4 another planner, 5 the statement.
export const IoaUpsert = ({ t }: CP) => {
  const f = t.frame;
  const s = t.step;
  const cols: [string, number, boolean][] = [
    ["item", 170, true],
    ["location", 180, true],
    ["ip__user_id", 200, true],
    ["ip__scenario_id", 230, true],
    ["ordering_cost", 210, false],
    ["ip__last_modified", 260, false],
  ];
  const rowA = { v: s >= 3 ? "15" : "12", ts: s >= 3 ? "10:42:07" : s >= 2 ? "10:41:30" : "10:41:02" };
  const flash = (st: number) => (s === st ? 1 - enter(f, at(t, st) + 30, 30) : 0);
  const Row = ({ vals, hl, o }: { vals: string[]; hl?: number; o: number }) => (
    <div style={{ display: "flex", gap: 6, opacity: o, background: hl ? `${C.green}${Math.round(hl * 60 + 10).toString(16).padStart(2, "0")}` : undefined, borderRadius: 10 }}>
      {vals.map((v, i) => (
        <div key={i} style={{ width: cols[i][1], padding: "12px 12px", fontFamily: MONO, fontSize: 23, boxSizing: "border-box", whiteSpace: "nowrap" }}>
          {v}
        </div>
      ))}
    </div>
  );
  const msg =
    s === 1 ? "first approval: no row with this key yet → INSERT" : s === 2 ? "the same approval again → ON CONFLICT → UPDATE the same row · still one row" : s === 3 ? "a new value from the same planner → the same row, now 15" : s >= 4 ? "planner B, scenario s-7, same item → a different key → its own row" : "";
  return (
    <>
      <Title text="UPSERT: one row per key, however many approvals" f={f} />
      <Abs x={90} y={226} w={1740} style={{ display: "flex", alignItems: "center", gap: 18, ...rise(f, 4) }}>
        <div style={{ fontSize: 27, fontWeight: 700 }}>conflict key</div>
        <Chip color={C.purple} style={{ fontSize: 24 }}>
          natural PK (item, location) + ip__user_id + ip__scenario_id
        </Chip>
      </Abs>
      <Abs x={90} y={310} w={1740} style={{ ...card(), padding: "14px 18px" }}>
        <div style={{ display: "flex", gap: 6, borderBottom: `1px solid ${C.line}`, paddingBottom: 6 }}>
          {cols.map(([c, w, key]) => (
            <div key={c} style={{ width: w, padding: "8px 12px", fontFamily: MONO, fontSize: 21, color: key ? C.purple : C.muted, boxSizing: "border-box" }}>
              {c}
            </div>
          ))}
        </div>
        {s === 0 && <div style={{ padding: "18px 12px", fontSize: 24, color: C.faint }}>(no edits yet)</div>}
        {s >= 1 && <Row vals={["Milk 1L", "West DC-1", "u-17", "s-42", rowA.v, rowA.ts]} hl={Math.max(flash(1), flash(2), flash(3))} o={enter(f, at(t, 1), 12)} />}
        {s >= 4 && <Row vals={["Milk 1L", "West DC-1", "u-08", "s-7", "11", "10:45:51"]} hl={flash(4)} o={enter(f, at(t, 4), 12)} />}
      </Abs>
      {s >= 1 && (
        <Abs key={s} x={90} y={540} w={1740} style={{ fontSize: 32, fontWeight: 700, color: C.green, ...rise(f, at(t, Math.min(s, 4)), 14) }}>
          {msg}
        </Abs>
      )}
      {s >= 5 && (
        <Abs x={90} y={620} w={1740} style={{ ...card(C.blue), padding: "20px 28px", fontFamily: MONO, fontSize: 25, lineHeight: 1.55, ...rise(f, at(t, 5)) }}>
          <span style={{ color: C.blue }}>INSERT INTO</span> {"<schema>.<kind>_u (<cols>) "}
          <span style={{ color: C.blue }}>VALUES</span> (%s, …)
          <br />
          <span style={{ color: C.blue }}>ON CONFLICT</span> (&lt;pk_cols&gt;, ip__user_id, ip__scenario_id)
          <br />
          <span style={{ color: C.blue }}>DO UPDATE SET</span> &lt;col&gt; = <span style={{ color: C.amber }}>EXCLUDED</span>.&lt;col&gt;
          <div style={{ fontFamily: "Inter", fontSize: 23, color: C.muted, marginTop: 8 }}>EXCLUDED = the row you just tried to insert</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ two turns

type TItem = { lane: 0 | 1 | 2; text: string; step: number; icon?: string; tone?: string };

// Two HTTP turns and the gap between them; each item appears at its step.
export const IoaTurns = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { title: string; lanes: [string, string, string]; items: TItem[] };
  const X = [80, 744, 1176];
  const Wd = [640, 408, 664];
  const counts = [0, 0, 0];
  const pos = p.items.map((it) => counts[it.lane]++);
  const rowH = 84;
  return (
    <>
      <Title text={p.title} f={f} />
      {p.lanes.map((l, i) => (
        <Abs key={i} x={X[i]} y={214} w={Wd[i]} h={i === 1 ? 660 : 660} style={{ borderRadius: 20, border: `2px ${i === 1 ? "dashed" : "solid"} ${C.line}`, background: i === 1 ? "transparent" : `${C.card}88`, opacity: enter(f, 4 + i * 6, 12) }}>
          <div style={{ padding: "12px 20px", fontSize: 26, fontWeight: 800, color: i === 1 ? C.muted : C.text, textAlign: i === 1 ? "center" : "left" }}>{l}</div>
        </Abs>
      ))}
      {p.items.map((it, i) => {
        if (t.step < it.step) return null;
        const cur = t.step === it.step;
        const col = tone(it.tone ?? (it.lane === 1 ? "muted" : "blue"));
        return (
          <Abs key={i} x={X[it.lane] + 16} y={270 + pos[i] * rowH} w={Wd[it.lane] - 32} h={rowH - 12} style={{ ...card(cur ? col : undefined), padding: "0 18px", display: "flex", alignItems: "center", gap: 14, boxSizing: "border-box", opacity: cur ? 1 : 0.7, ...rise(f, at(t, it.step), 14) }}>
            {it.icon && <div style={{ fontSize: 30, flex: "none" }}>{it.icon}</div>}
            <div style={{ fontFamily: MONO, fontSize: it.text.length > 40 ? 20 : 22, lineHeight: 1.25, fontWeight: 600 }}>{it.text}</div>
          </Abs>
        );
      })}
    </>
  );
};

// ------------------------------------------------------------------ Redis staging

// Steps: 0 empty, 1 the read, 2 the proposal, 3 approved: commit, 4 abandoned:
// the keys expire and nothing was ever written.
export const IoaRedis = ({ t }: CP) => {
  const f = t.frame;
  const s = t.step;
  const tools = ["read_parameters", "prepare_parameter_update", "update_parameters"];
  const lit = s === 1 ? 0 : s === 2 ? 1 : s === 3 ? 2 : -1;
  const ttl = (st: number) => {
    if (s < 4) return 1;
    return 1 - ease(f, at(t, 4) + 10, 150);
  };
  const Key = ({ y, k, v, st }: { y: number; k: string; v: string; st: number }) => {
    const life = ttl(st);
    return (
      <Abs x={700} y={y} w={560} style={{ ...card(s === st ? C.red : undefined), padding: "14px 18px", opacity: enter(f, at(t, st) + 12, 12) * (life < 0.02 ? 0.15 : 1) }}>
        <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: "#ff8a80" }}>{k}</div>
        <div style={{ fontSize: 21, color: C.muted, marginTop: 4 }}>{v}</div>
        <div style={{ marginTop: 10, height: 8, borderRadius: 4, background: C.line }}>
          <div style={{ width: `${life * 100}%`, height: 8, borderRadius: 4, background: C.amber }} />
        </div>
        <div style={{ fontSize: 18, color: C.faint, marginTop: 4 }}>TTL {life < 0.02 ? "· expired, gone" : ""}</div>
      </Abs>
    );
  };
  const arrow = (x1: number, y1: number, x2: number, y2: number, on: boolean, label?: string) => (
    <g opacity={on ? 1 : 0}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.blue} strokeWidth={3.5} strokeDasharray="10 8" strokeDashoffset={-(f % 36)} />
      {label && (
        <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 10} fill={C.blue} fontSize={20} fontFamily="Inter" textAnchor="middle" fontWeight={600}>
          {label}
        </text>
      )}
    </g>
  );
  return (
    <>
      <Title text="Redis holds what the agent wants to do" f={f} sub="the database is touched by the read, and then only after approval" />
      {tools.map((tl, i) => (
        <Abs key={tl} x={80} y={300 + i * 170} w={480} h={110} style={{ ...card(lit === i ? C.blue : undefined), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 25, fontWeight: 700, opacity: (lit === -1 || lit === i ? 1 : 0.45) * enter(f, 6 + i * 6, 12) }}>
          {tl}
          {i === 2 && <span style={{ fontSize: 22, color: C.green, marginLeft: 10 }}>(gated)</span>}
        </Abs>
      ))}
      <Abs x={680} y={240} w={600} h={620} style={{ borderRadius: 22, border: `2px solid ${C.red}66`, background: `${C.red}0d`, opacity: enter(f, 8, 12) }}>
        <div style={{ padding: "12px 20px", fontSize: 27, fontWeight: 800, color: "#ff8a80" }}>Redis · namespaced keys + TTL</div>
      </Abs>
      {s >= 1 && <Key y={310} st={1} k="param_read:{conversation_id}:…" v="the 9 rows the planner saw" />}
      {s >= 2 && <Key y={520} st={2} k="param_prepared:{conversation_id}:{uuid}" v="pending changes + affected rows: cost 10 → 12" />}
      <Abs x={1400} y={300} w={440} h={420} style={{ ...card(s === 3 ? C.green : undefined), padding: "18px 22px", opacity: enter(f, 10, 12) }}>
        <div style={{ fontSize: 28, fontWeight: 800 }}>🐘 UICache Postgres</div>
        <div style={{ fontSize: 22, color: C.muted, marginTop: 8, lineHeight: 1.45 }}>
          Base VIEWs (read)
          <br />
          {"<kind>_u overlay (write)"}
        </div>
        <div style={{ marginTop: 22, fontSize: 24, fontWeight: 700, color: s === 3 ? C.green : s >= 4 ? C.amber : C.faint }}>
          {s < 3 ? "nothing written yet" : s === 3 ? "✓ UPSERT after approval" : "abandoned: never touched"}
        </div>
      </Abs>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {arrow(560, 355, 700, 360, s === 1, "SET")}
        {arrow(1400, 400, 1260, 360, s === 1, "SELECT rows")}
        {arrow(700, 380, 560, 520, s === 2, "GET")}
        {arrow(560, 540, 700, 570, s === 2, "SET")}
        {arrow(700, 600, 560, 690, s === 3, "GET")}
        {arrow(1260, 640, 1400, 600, s === 3, "UPSERT _u")}
      </svg>
    </>
  );
};

// ------------------------------------------------------------------ the SSE stream

// One HTTP response held open; envelopes flow to the UI. Steps: 0 the pipe,
// 1 deltas, 2 complete + interrupted, 3 the approval card, 4 the wire format.
export const IoaSse = ({ t }: CP) => {
  const f = t.frame;
  const s = t.step;
  const X1 = 520;
  const X2 = 1250;
  const env = [
    { k: "delta", v: "“Proposed update:”", col: C.blue },
    { k: "delta", v: "“9 rows, cost 10 → 12”", col: C.blue },
    { k: "complete", v: "interrupted: true · pending_actions", col: C.amber },
  ];
  return (
    <>
      <Title text="Streaming a turn: Server-Sent Events" f={f} sub="one HTTP response, kept open, with small events written into it" />
      <Abs x={80} y={330} w={420} h={200} style={{ ...card(), padding: "20px 22px" }}>
        <div style={{ fontSize: 28, fontWeight: 800 }}>⚙️ FastAPI</div>
        <div style={{ fontFamily: MONO, fontSize: 21, color: C.muted, marginTop: 8, lineHeight: 1.45 }}>
          astream_events(v2)
          <br />→ event processor
        </div>
      </Abs>
      <Abs x={1270} y={260} w={570} h={480} style={{ ...card(s >= 3 ? C.amber : undefined), padding: "20px 22px" }}>
        <div style={{ fontSize: 28, fontWeight: 800 }}>🖥 Planning UI chat</div>
        {s >= 1 && <div style={{ fontSize: 25, marginTop: 16, lineHeight: 1.4, opacity: enter(f, at(t, 1) + 40, 10) }}>Proposed update: 9 rows, ordering cost 10 → 12</div>}
        {s >= 3 && (
          <div style={{ ...card(C.amber), marginTop: 22, padding: "18px 20px", ...rise(f, at(t, 3), 16) }}>
            <div style={{ fontSize: 26, fontWeight: 800 }}>Update replenishment parameters</div>
            <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
              <Chip color={C.green}>Approve</Chip>
              <Chip color={C.red}>Reject</Chip>
            </div>
          </div>
        )}
      </Abs>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <line x1={X1} y1={436} x2={X2 + 10} y2={436} stroke={C.blue} strokeWidth={3} strokeDasharray="10 10" strokeDashoffset={-(f % 40)} opacity={0.7} />
        <polygon points={`${X2 + 20},436 ${X2 + 4},426 ${X2 + 4},446`} fill={C.blue} opacity={0.7} />
        <text x={(X1 + X2) / 2} y={490} fill={C.muted} fontSize={22} textAnchor="middle" fontFamily="Inter">
          Content-Type: text/event-stream · one direction: server → browser
        </text>
      </svg>
      {env.map((e, i) => {
        const st = i < 2 ? 1 : 2;
        if (s < st) return null;
        const start = at(t, st) + (i % 2) * 22 + 6;
        const p = ease(f, start, 40);
        const x = lerp(X1, X2 - 190, p);
        const arrived = p >= 1;
        if (s >= 4) return null;
        return (
          <Abs key={i} x={arrived ? 560 + i * 0 : x} y={arrived ? 580 + i * 62 : 414} w={arrived ? 640 : 190} style={{ padding: "6px 12px", borderRadius: 10, background: `${e.col}30`, border: `1.5px solid ${e.col}`, fontFamily: MONO, fontSize: arrived ? 21 : 19, whiteSpace: "nowrap", overflow: "hidden", boxSizing: "border-box", opacity: enter(f, start, 6) }}>
            <b style={{ color: e.col }}>{e.k}</b>
            {arrived ? `  ${e.v}` : ""}
          </Abs>
        );
      })}
      {s >= 4 && (
        <Abs x={80} y={560} w={1140} style={{ ...card(C.blue), padding: "18px 26px", fontFamily: MONO, fontSize: 24, lineHeight: 1.5, ...rise(f, at(t, 4)) }}>
          <div style={{ fontFamily: "Inter", fontSize: 22, color: C.muted, marginBottom: 6 }}>on the wire: plain text, a blank line ends each event</div>
          {["event: delta", "data: {…}", "", "event: complete", "data: { interrupted: true, pending_actions: [ … ] }", "", "event: error"].map((ln, i) => (
            <div key={i} style={{ minHeight: "1.5em", color: ln.startsWith("event") ? C.blue : C.text }}>
              {ln}
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};
