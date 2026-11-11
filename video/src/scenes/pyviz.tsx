// Concept pictures for the Python and FastAPI lectures (PY-01, FA-01), each a
// small machine shown one state per beat: a dict's hash table, a list's block
// of pointers, the LEGB scopes, an index tape (iterators, slicing, pointers)
// and the asyncio event loop.
import { C, MONO, tone } from "../lib/theme.ts";
import { ease, enter, lerp, rise } from "../lib/anim.ts";
import { Abs, card } from "./ui.tsx";
import { at } from "./custom3.tsx";
import type { CP } from "./secui.tsx";
import { Note, Title } from "./py.tsx";

const cur = <T,>(t: CP["t"], steps: T[]) => Math.min(t.step, steps.length - 1);
const COLS = ["#ff8a3d", "#2dd4bf", "#ffd166", "#ff6fa5", "#38d996", "#a78bfa", "#5b9cff", "#ff6262"];
const colOf = (s: string) => COLS[[...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % COLS.length];

const Down = ({ x, y, h, f, start, color = C.muted }: { x: number; y: number; h: number; f: number; start: number; color?: string }) => {
  const p = enter(f, start, 14);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <line x1={x} y1={y} x2={x} y2={y + h * p} stroke={color} strokeWidth={4} strokeLinecap="round" />
      {p > 0.95 && <polygon points={`${x},${y + h + 4} ${x - 10},${y + h - 12} ${x + 10},${y + h - 12}`} fill={color} />}
    </svg>
  );
};

// ------------------------------------------------------------------ dict: the hash table

// Left: the key going through hash() and % size to a slot. Right: the table.
// Every step that is not a lookup inserts its key (cumulative); `probe` lists
// slots that were taken before the key landed; `lookup` jumps straight there.
type HStep = { key: string; value?: string; hash: string; slot: number; probe?: number[]; lookup?: boolean; note?: string };
export const PyHash = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { title: string; sub?: string; size: number; steps: HStep[] };
  const si = cur(t, p.steps);
  const s = p.steps[si];
  const st = at(t, si);
  const filled: Record<number, HStep> = {};
  p.steps.slice(0, si + 1).forEach((x) => {
    if (!x.lookup) filled[x.slot] = x;
  });
  const top = 262;
  const rh = Math.min(72, Math.floor(600 / p.size));
  const tx = 1060;
  const tw = 780;
  const land = ease(f, st + 34 + (s.probe?.length ?? 0) * 16, 14);
  const lx = 80;
  const lw = 820;
  return (
    <>
      <Title text={p.title} f={f} sub={p.sub} />
      <Abs x={lx} y={262} w={lw} style={{ fontSize: 22, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>{s.lookup ? "LOOK UP" : "INSERT"}</Abs>
      <Abs key={`k${si}`} x={lx} y={300} w={lw} style={{ ...card(colOf(s.key)), padding: "16px 26px", fontFamily: MONO, fontSize: 32, fontWeight: 700, ...rise(f, st, 12) }}>
        {s.lookup ? `d[${s.key}]` : `d[${s.key}] = ${s.value ?? "…"}`}
      </Abs>
      <Down x={lx + lw / 2} y={384} h={46} f={f} start={st + 8} />
      <Abs key={`h${si}`} x={lx} y={440} w={lw} style={{ ...card(), padding: "16px 26px", fontFamily: MONO, fontSize: 30, ...rise(f, st + 12, 12) }}>
        hash({s.key}) = <span style={{ color: C.amber, fontWeight: 700 }}>{s.hash}</span>
      </Abs>
      <Down x={lx + lw / 2} y={522} h={46} f={f} start={st + 20} />
      <Abs key={`m${si}`} x={lx} y={578} w={lw} style={{ ...card(C.blue), padding: "16px 26px", fontFamily: MONO, fontSize: 30, ...rise(f, st + 24, 12) }}>
        {s.hash} % {p.size} = <span style={{ color: C.blue, fontWeight: 800 }}>slot {s.probe?.length ? s.probe[0] : s.slot}</span>
      </Abs>
      {!!s.probe?.length && (
        <Abs key={`p${si}`} x={lx} y={690} w={lw} style={{ fontSize: 27, color: C.red, fontWeight: 700, lineHeight: 1.35, ...rise(f, st + 36, 10) }}>
          slot {s.probe.join(", ")} taken → probe on → slot {s.slot}
        </Abs>
      )}
      {Array.from({ length: p.size }, (_, i) => {
        const e = filled[i];
        const target = i === s.slot;
        const probing = s.probe?.includes(i) && f >= st + 30 && land < 1;
        const isNew = target && !s.lookup;
        const show = e && (!isNew || land > 0);
        const col = target ? (s.lookup ? C.green : colOf(s.key)) : probing ? C.red : undefined;
        return (
          <Abs key={i} x={tx} y={top + i * rh} w={tw} h={rh - 10} style={{ ...card(col), background: target && land > 0 ? `${col}22` : C.card, display: "flex", alignItems: "center", padding: "0 22px", boxSizing: "border-box", borderRadius: 14, opacity: enter(f, 4 + i * 2, 12) }}>
            <span style={{ fontFamily: MONO, fontSize: 22, color: C.faint, width: 70 }}>{i}</span>
            {show ? (
              <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, opacity: isNew ? land : 1 }}>
                <span style={{ color: colOf(e.key) }}>{e.key}</span>
                <span style={{ color: C.muted }}> → {e.value ?? "…"}</span>
              </span>
            ) : (
              <span style={{ fontSize: 22, color: C.faint }}>empty</span>
            )}
          </Abs>
        );
      })}
      {s.note && <Note key={`n${si}`} text={s.note} f={f} start={st + 50} y={top + p.size * rh + 18 > 880 ? 900 : 880} />}
    </>
  );
};

// ------------------------------------------------------------------ list: a block of pointers

// The list's own memory is a row of slots (capacity); the first `len` point at
// objects that live elsewhere. `shift` animates every slot moving one right
// (insert at the front); `grow` shows the old block copied into a bigger one.
type LStep = { len: number; cap: number; shift?: boolean; grow?: boolean; hl?: number; op?: string; note?: string };
export const PyList = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { title: string; sub?: string; items: string[]; steps: LStep[] };
  const si = cur(t, p.steps);
  const s = p.steps[si];
  const st = at(t, si);
  const maxCap = Math.max(...p.steps.map((x) => x.cap));
  const cw = Math.min(150, Math.floor(1680 / maxCap));
  const x0 = 80 + (1760 - cw * maxCap) / 2;
  const y = 360;
  const ch = 96;
  const sh = s.shift ? ease(f, st + 10, 40) : 0;
  const prevCap = si > 0 ? p.steps[si - 1].cap : s.cap;
  return (
    <>
      <Title text={p.title} f={f} sub={p.sub} />
      <Abs x={x0} y={270} w={1700} style={{ display: "flex", gap: 40, fontFamily: MONO, fontSize: 28, fontWeight: 700, ...rise(f, 4) }}>
        <span>len = <span style={{ color: C.blue }}>{s.len}</span></span>
        <span>capacity = <span style={{ color: C.amber }}>{s.cap}</span></span>
        {s.op && <span key={si} style={{ color: C.green, ...rise(f, st, 10) }}>{s.op}</span>}
      </Abs>
      {s.grow && (
        <Abs x={x0} y={y - 4} w={cw * prevCap} h={ch + 8} style={{ border: `3px dashed ${C.red}`, borderRadius: 16, opacity: 1 - enter(f, st + 40, 20) }} />
      )}
      {Array.from({ length: s.cap }, (_, i) => {
        const used = i < s.len;
        const newSlot = s.grow && i >= prevCap;
        const dx = s.shift && used ? (i === 0 ? 0 : -cw * (1 - sh)) : 0;
        const col = i === s.hl ? C.green : used ? C.blue : C.line;
        return (
          <Abs key={i} x={x0 + i * cw + dx} y={y} w={cw - 10} h={ch} style={{ ...card(col), border: `2px ${used ? "solid" : "dashed"} ${col}`, background: used ? `${col}1a` : "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 14, opacity: newSlot ? enter(f, st + 20, 14) : s.shift && i === 0 ? enter(f, st + 44, 10) : 1 }}>
            <span style={{ fontFamily: MONO, fontSize: 20, color: C.faint }}>[{i}]</span>
            {used && <span style={{ width: 16, height: 16, borderRadius: 8, background: col, marginTop: 8 }} />}
          </Abs>
        );
      })}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: s.len }, (_, i) => {
          if (s.shift && i === 0 && sh < 1) return null;
          const xa = x0 + i * cw + (cw - 10) / 2 + (s.shift && i > 0 ? -cw * (1 - sh) : 0);
          return <line key={i} x1={xa} y1={y + ch - 22} x2={xa} y2={y + ch + 120} stroke={i === s.hl ? C.green : C.blue} strokeWidth={3} opacity={0.75} />;
        })}
      </svg>
      {Array.from({ length: s.len }, (_, i) => {
        if (s.shift && i === 0 && sh < 1) return null;
        const label = p.items[i % p.items.length];
        const xa = x0 + i * cw + (cw - 10) / 2 + (s.shift && i > 0 ? -cw * (1 - sh) : 0);
        return (
          <Abs key={`o${i}`} x={xa - 70} y={y + ch + 120} w={140} style={{ ...card(i === s.hl ? C.green : undefined), padding: "10px 6px", textAlign: "center", fontFamily: MONO, fontSize: label.length > 7 ? 18 : 22, borderRadius: 12 }}>
            {label}
          </Abs>
        );
      })}
      <Abs x={x0} y={y + ch + 190} w={1700} style={{ fontSize: 22, color: C.faint, ...rise(f, 10) }}>
        the objects live elsewhere in memory; the list holds only pointers to them
      </Abs>
      {s.note && <Note key={`n${si}`} text={s.note} f={f} start={st + 30} y={850} />}
    </>
  );
};

// ------------------------------------------------------------------ LEGB

// Nested boxes, outermost first (Built-in ⊃ Global ⊃ Enclosing ⊃ Local). A
// step with `find` sends a search for that name from the innermost box
// outward; it stops at `hit` (a layer index) or fails (NameError).
type SStep = { find?: string; hit?: number; note?: string };
export const PyScope = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { title: string; sub?: string; layers: { name: string; vars: string[]; tone?: string }[]; steps: SStep[] };
  const si = cur(t, p.steps);
  const s = p.steps[si];
  const st = at(t, si);
  const L = p.layers.length;
  const box = { x: 80, y: 250, w: 1100, h: 600 };
  const inset = 56;
  const rect = (i: number) => ({ x: box.x + i * inset, y: box.y + i * (inset + 22), w: box.w - 2 * i * inset, h: box.h - 2 * i * (inset + 22) });
  // the search visits layers L-1, L-2, … down to the hit
  const target = s.find ? (s.hit ?? -1) : null;
  const visits = target === null ? 0 : L - Math.max(0, target);
  const prog = target === null ? 0 : ease(f, st + 8, 22 * visits);
  const reached = target === null ? L : L - 1 - Math.min(visits - 1, Math.floor(prog * visits));
  const done = prog >= 1;
  return (
    <>
      <Title text={p.title} f={f} sub={p.sub} />
      {p.layers.map((ly, i) => {
        const r = rect(i);
        const col = tone(ly.tone ?? ["purple", "blue", "cyan", "green"][i % 4]);
        const visited = target !== null && i >= reached;
        const hit = target !== null && done && i === target;
        const border = hit ? C.green : visited ? C.amber : col;
        return (
          <Abs key={i} x={r.x} y={r.y} w={r.w} h={r.h} style={{ ...card(border), background: hit ? `${C.green}18` : i === 0 ? C.card : `${C.bg}cc`, border: `${hit || visited ? 3 : 2}px solid ${border}`, opacity: enter(f, 4 + i * 6, 14) }}>
            <div style={{ position: "absolute", left: 20, top: 10, fontSize: 25, fontWeight: 800, color: border }}>{ly.name}</div>
            <div style={{ position: "absolute", right: 18, top: 12, fontFamily: MONO, fontSize: 21, color: C.muted, maxWidth: r.w - 300, textAlign: "right", whiteSpace: "nowrap", overflow: "hidden" }}>{ly.vars.join("  ")}</div>
          </Abs>
        );
      })}
      {s.find && (
        <Abs key={`f${si}`} x={rect(L - 1).x + 30} y={rect(L - 1).y + rect(L - 1).h / 2 - 10} w={rect(L - 1).w - 60} style={{ fontFamily: MONO, fontSize: 32, fontWeight: 800, color: C.amber, textAlign: "center", ...rise(f, st, 10) }}>
          {s.find} ?
        </Abs>
      )}
      <Abs x={1260} y={270} w={580}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, color: C.muted, marginBottom: 14 }}>LOOKUP ORDER</div>
        {[...p.layers].reverse().map((ly, k) => {
          const i = L - 1 - k;
          const visited = target !== null && i >= reached;
          const hit = target !== null && done && i === target;
          return (
            <div key={i} style={{ ...card(hit ? C.green : visited ? C.amber : undefined), padding: "14px 22px", marginBottom: 12, fontSize: 27, fontWeight: 700, display: "flex", justifyContent: "space-between", opacity: enter(f, 6 + k * 4, 12) }}>
              <span>{["L", "E", "G", "B"][k] ?? ""} · {ly.name}</span>
              <span style={{ color: hit ? C.green : visited ? C.amber : C.faint }}>{hit ? "found" : visited && target !== null ? "not here" : ""}</span>
            </div>
          );
        })}
        {target === -1 && done && <div style={{ ...card(C.red), padding: "14px 22px", fontFamily: MONO, fontSize: 26, color: C.red, fontWeight: 800, ...rise(f, st + 8 + 22 * visits, 10) }}>NameError</div>}
      </Abs>
      {s.note && <Note key={`n${si}`} text={s.note} f={f} start={st + 12 + 22 * visits} y={880} />}
    </>
  );
};

// ------------------------------------------------------------------ index tape

// A row of cells with indices (and negative ones), and one state per step: a
// pointer (an iterator's position), a picked range or set of cells (a slice),
// an output, a label. Used for iterators, slicing, two pointers, windows.
type TStep = { cells?: string[]; ptr?: number | null; ptr2?: number | null; pick?: number[]; range?: [number, number]; out?: string; label?: string; label2?: string; note?: string; stop?: boolean };
export const PyTape = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { title: string; sub?: string; cells: string[]; neg?: boolean; idx?: boolean; steps: TStep[]; outLabel?: string };
  const si = cur(t, p.steps);
  const s = p.steps[si];
  const st = at(t, si);
  const cells = s.cells ?? p.cells;
  const n = Math.max(...p.steps.map((x) => (x.cells ?? p.cells).length), p.cells.length);
  const cw = Math.min(150, Math.floor(1600 / n));
  const x0 = 80 + (1760 - cw * n) / 2;
  const y = 410;
  const h = 120;
  const picks = new Set(s.pick ?? (s.range ? Array.from({ length: Math.max(0, s.range[1] - s.range[0]) }, (_, k) => s.range![0] + k) : []));
  const ptrX = (i: number) => x0 + i * cw + (cw - 10) / 2;
  const prev = si > 0 ? p.steps[si - 1] : s;
  const k = ease(f, st + 4, 14);
  const px = s.ptr == null ? null : lerp(ptrX(prev.ptr ?? s.ptr), ptrX(s.ptr), k);
  const px2 = s.ptr2 == null ? null : lerp(ptrX(prev.ptr2 ?? s.ptr2), ptrX(s.ptr2), k);
  return (
    <>
      <Title text={p.title} f={f} sub={p.sub} />
      {cells.map((c, i) => {
        const on = picks.has(i);
        const col = on ? C.blue : undefined;
        return (
          <div key={i}>
            {p.idx !== false && (
              <Abs x={x0 + i * cw} y={y - 46} w={cw - 10} style={{ textAlign: "center", fontFamily: MONO, fontSize: 22, color: on ? C.blue : C.faint, opacity: enter(f, 6) }}>
                {i}
              </Abs>
            )}
            <Abs key={`${si}-${c}`} x={x0 + i * cw} y={y} w={cw - 10} h={h} style={{ ...card(col), background: on ? `${C.blue}26` : C.card, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: c.length > 4 ? 26 : 40, fontWeight: 700, borderRadius: 14, opacity: s.stop ? 0.45 : 1, ...rise(f, (s.cells ? st : 4) + i * 2, 12) }}>
              {c}
            </Abs>
            {p.neg && (
              <Abs x={x0 + i * cw} y={y + h + 12} w={cw - 10} style={{ textAlign: "center", fontFamily: MONO, fontSize: 22, color: C.pink, opacity: enter(f, 10) }}>
                {i - cells.length}
              </Abs>
            )}
          </div>
        );
      })}
      {px !== null && (
        <Abs x={px - 120} y={y + h + (p.neg ? 54 : 18)} w={240} style={{ textAlign: "center", color: C.amber, fontWeight: 800 }}>
          <div style={{ fontSize: 36, lineHeight: 1 }}>▲</div>
          <div style={{ fontFamily: MONO, fontSize: 24, marginTop: 4 }}>{s.label ?? "next"}</div>
        </Abs>
      )}
      {px2 !== null && (
        <Abs x={px2 - 120} y={y + h + (p.neg ? 54 : 18)} w={240} style={{ textAlign: "center", color: C.cyan, fontWeight: 800 }}>
          <div style={{ fontSize: 36, lineHeight: 1 }}>▲</div>
          <div style={{ fontFamily: MONO, fontSize: 24, marginTop: 4 }}>{s.label2 ?? ""}</div>
        </Abs>
      )}
      {s.out !== undefined && (
        <Abs key={`o${si}`} x={x0} y={y + h + 160} w={cw * n} style={{ display: "flex", justifyContent: "center", ...rise(f, st + 10, 12) }}>
          <div style={{ ...card(s.stop ? C.red : C.green), padding: "16px 32px", fontFamily: MONO, fontSize: 32, fontWeight: 700, color: s.stop ? C.red : C.text }}>
            {p.outLabel && <span style={{ color: C.muted, fontWeight: 600 }}>{p.outLabel} </span>}
            {s.out}
          </div>
        </Abs>
      )}
      {s.note && <Note key={`n${si}`} text={s.note} f={f} start={st + 20} y={880} />}
    </>
  );
};

// ------------------------------------------------------------------ the event loop

// One state per step: the task the loop is running (only ever one), the ready
// queue, the tasks parked waiting on I/O, and the finished ones.
type EStep = { running?: string; ready: string[]; waiting: string[]; done?: string[]; note?: string; blocked?: boolean };
export const PyLoop = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { title: string; sub?: string; steps: EStep[]; runLabel?: string };
  const si = cur(t, p.steps);
  const s = p.steps[si];
  const st = at(t, si);
  const chip = (name: string, k: number, w = 440) => (
    <div key={name} style={{ ...card(colOf(name)), background: `${colOf(name)}1c`, padding: "14px 22px", marginBottom: 14, width: w, boxSizing: "border-box", fontFamily: MONO, fontSize: 26, fontWeight: 700, ...rise(f, st + 4 + k * 3, 12) }}>
      {name}
    </div>
  );
  const col = (x: number, label: string, items: string[], sub: string) => (
    <Abs x={x} y={262} w={500}>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, color: C.muted }}>{label}</div>
      <div style={{ fontSize: 20, color: C.faint, marginBottom: 16 }}>{sub}</div>
      {items.map((it, k) => chip(it, k))}
    </Abs>
  );
  const spin = (f / 30) * (s.blocked ? 0 : 1) * 1.6;
  return (
    <>
      <Title text={p.title} f={f} sub={p.sub} />
      {col(80, "READY", s.ready, "can run now, waiting for their turn")}
      {col(1360, "WAITING", s.waiting, "parked on I/O: network, disk, sleep")}
      <Abs x={700} y={262} w={520} h={520}>
        <svg width={520} height={520} style={{ position: "absolute", inset: 0 }}>
          <circle cx={260} cy={260} r={220} fill="none" stroke={s.blocked ? C.red : C.line} strokeWidth={6} strokeDasharray="22 16" transform={`rotate(${spin * 20} 260 260)`} />
          <polygon points="260,28 278,52 242,52" fill={s.blocked ? C.red : C.blue} transform={`rotate(${spin * 20} 260 260)`} />
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, top: 92, textAlign: "center", fontSize: 22, fontWeight: 800, letterSpacing: 2, color: s.blocked ? C.red : C.muted }}>{s.blocked ? "LOOP BLOCKED" : (p.runLabel ?? "RUNNING")}</div>
        <div style={{ position: "absolute", left: 80, right: 80, top: 200, display: "flex", justifyContent: "center" }}>
          {s.running ? (
            <div key={`${si}${s.running}`} style={{ ...card(s.blocked ? C.red : colOf(s.running)), background: `${s.blocked ? C.red : colOf(s.running)}26`, padding: "22px 24px", fontFamily: MONO, fontSize: 28, fontWeight: 800, textAlign: "center", boxShadow: `0 0 40px ${s.blocked ? C.red : colOf(s.running)}55`, ...rise(f, st + 2, 12) }}>
              {s.running}
            </div>
          ) : (
            <div style={{ fontSize: 24, color: C.faint, marginTop: 30 }}>idle</div>
          )}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", fontSize: 21, color: C.faint }}>one task at a time, until it awaits</div>
      </Abs>
      {!!s.done?.length && (
        <Abs x={700} y={790} w={1140} style={{ display: "flex", gap: 14, alignItems: "center", fontSize: 22, color: C.green, fontWeight: 800 }}>
          DONE
          {s.done.map((d) => (
            <span key={d} style={{ fontFamily: MONO, fontSize: 22, color: C.text, ...card(C.green), padding: "6px 14px", borderRadius: 999 }}>
              {d}
            </span>
          ))}
        </Abs>
      )}
      {s.note && <Note key={`n${si}`} text={s.note} f={f} start={st + 14} y={880} />}
    </>
  );
};

// ------------------------------------------------------------------ LangGraph state + reducers

// Left: the updates nodes returned this round. Right: the state's keys, each
// with its reducer and its value after the merge. A step with `error` shows
// the merge failing instead (two writes, no reducer).
type GUpd = { node: string; key: string; val: string };
type GStep = { round?: string; updates?: GUpd[]; values: Record<string, string>; error?: string; note?: string };
export const LgState = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { title: string; sub?: string; fields: { key: string; reducer: string }[]; steps: GStep[] };
  const si = cur(t, p.steps);
  const s = p.steps[si];
  const st = at(t, si);
  const changed = new Set((s.updates ?? []).map((u) => u.key));
  const rh = Math.min(104, Math.floor(480 / p.fields.length));
  return (
    <>
      <Title text={p.title} f={f} sub={p.sub} />
      <Abs x={80} y={262} w={740}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, color: C.muted, marginBottom: 14 }}>{s.round ?? "NODES RETURN"}</div>
        {(s.updates ?? []).map((u, k) => (
          <div key={`${si}-${k}`} style={{ ...card(colOf(u.node)), padding: "14px 22px", marginBottom: 14, ...rise(f, st + 4 + k * 5, 12) }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: colOf(u.node) }}>{u.node}</div>
            <div style={{ fontFamily: MONO, fontSize: 25, marginTop: 4 }}>{`{"${u.key}": ${u.val}}`}</div>
          </div>
        ))}
        {!s.updates?.length && <div style={{ fontSize: 24, color: C.faint }}>nothing yet</div>}
      </Abs>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {!!s.updates?.length && (
          <g opacity={enter(f, st + 14, 12)}>
            <line x1={840} y1={540} x2={900} y2={540} stroke={s.error ? C.red : C.amber} strokeWidth={5} />
            <polygon points="912,540 896,530 896,550" fill={s.error ? C.red : C.amber} />
          </g>
        )}
      </svg>
      <Abs x={930} y={262} w={910}>
        <div style={{ display: "flex", fontSize: 22, fontWeight: 800, letterSpacing: 2, color: C.muted, marginBottom: 14 }}>
          <span style={{ width: 230 }}>STATE KEY</span>
          <span style={{ width: 250 }}>REDUCER</span>
          <span>VALUE</span>
        </div>
        {p.fields.map((fd, i) => {
          const on = changed.has(fd.key);
          const bad = on && !!s.error;
          return (
            <div key={fd.key} style={{ ...card(bad ? C.red : on ? C.amber : undefined), display: "flex", alignItems: "center", height: rh - 14, marginBottom: 14, padding: "0 20px", boxSizing: "border-box", background: on ? `${bad ? C.red : C.amber}14` : C.card, opacity: enter(f, 4 + i * 3, 12) }}>
              <span style={{ width: 210, fontFamily: MONO, fontSize: 25, fontWeight: 700 }}>{fd.key}</span>
              <span style={{ width: 250, fontFamily: MONO, fontSize: 20, color: C.cyan }}>{fd.reducer}</span>
              <span key={`${si}-${fd.key}`} style={{ fontFamily: MONO, fontSize: 24, color: on ? C.text : C.muted, ...(on ? rise(f, st + 22, 10) : {}) }}>{s.values[fd.key] ?? ""}</span>
            </div>
          );
        })}
        {s.error && (
          <div style={{ ...card(C.red), padding: "14px 22px", fontFamily: MONO, fontSize: 25, color: C.red, fontWeight: 800, ...rise(f, st + 24, 10) }}>{s.error}</div>
        )}
      </Abs>
      {s.note && <Note key={`n${si}`} text={s.note} f={f} start={st + 30} y={890} />}
    </>
  );
};
