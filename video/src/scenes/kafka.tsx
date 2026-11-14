// KFK-ALL: partition logs as rows of offset cells. Each step is the whole
// state: new cells pop in at the end, pointers (committed offset, high
// watermark, a consumer's position) slide to their new offset, a row can go
// down. The step is explained in LL-01's panel on the right.
import { C, MONO } from "../lib/theme.ts";
import { enter, lerp, rise } from "../lib/anim.ts";
import { Abs } from "./ui.tsx";
import { at } from "./custom3.tsx";
import { Panel } from "./ll01.tsx";
import type { CP } from "./secui.tsx";

// A cell is "text" or "text@offset"; a leading mark sets its colour:
// "+" green, "!" red, "*" amber, "~" faded (aborted / deleted), "#" a control marker.
type Ptr = { at: number; l: string; tone?: string; top?: boolean };
type RowState = { cells: string[]; ptrs?: Ptr[]; dead?: boolean; label?: string; sub?: string; tone?: string };
type LStep = { t?: string; b?: string; m?: string; rows: Record<string, RowState> };
type RowDef = { id: string; label: string; sub?: string };
export type LogProps = { title?: string; rows: RowDef[]; steps: LStep[]; panel?: boolean; cell?: number };

const toneCol = (t?: string) => (t === "green" ? C.green : t === "red" ? C.red : t === "amber" ? C.amber : t === "teal" ? C.cyan : t === "purple" ? C.purple : t === "muted" ? C.muted : C.blue);

const parseCell = (raw: string, i: number) => {
  let s = raw;
  let mark = "";
  if ("+!*~#".includes(s[0]) && s.length > 1) {
    mark = s[0];
    s = s.slice(1);
  }
  const m = s.match(/^(.*)@(-?\d+)$/);
  return { text: m ? m[1] : s, off: m ? Number(m[2]) : i, mark };
};

export const KLog = ({ t, props }: CP) => {
  const p = props as unknown as LogProps;
  const f = t.frame;
  const step = Math.min(t.step, p.steps.length - 1);
  const st = p.steps[step];
  const prev = p.steps[Math.max(0, step - 1)];
  const since = t.since(t.step);
  const panel = p.panel !== false;
  const top = p.title ? 250 : 190;
  const X = 80;
  const W = panel ? 1220 : 1760;
  const LW = 270; // row label column
  const rows = p.rows.filter((r) => st.rows[r.id]);
  const n = Math.max(1, rows.length);
  const avail = 880 - top;
  const RH = Math.min(190, avail / n);
  const y0 = top + Math.max(0, (avail - RH * n) / 2 - 20);
  const maxCells = Math.max(...p.steps.flatMap((s) => Object.values(s.rows).map((r) => r.cells.length + 1)), 4);
  const CW = p.cell ?? Math.min(150, Math.floor((W - LW - 20) / maxCells));
  const CH = 70; // cell height
  const k = step === 0 ? 1 : enter(since, 0, 18);
  // Panel: the latest step that has something to say.
  let pi = step;
  while (pi > 0 && !p.steps[pi]?.t && !p.steps[pi]?.b) pi--;
  const ps = p.steps[pi];
  const numbered = p.steps.slice(0, pi + 1).filter((s) => s.t || s.b).length - 1;
  return (
    <>
      {p.title && (
        <Abs x={80} y={128} w={1220} style={{ fontFamily: C.head, fontSize: p.title.length > 40 ? 40 : 46, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15, ...rise(f, 2) }}>
          {p.title}
        </Abs>
      )}
      {rows.map((r, ri) => {
        const rs = st.rows[r.id];
        const pr = step > 0 ? prev.rows[r.id] : undefined;
        const y = y0 + ri * RH;
        const cy = y + 24;
        const dead = !!rs.dead;
        const col = dead ? C.red : toneCol(rs.tone);
        const cells = rs.cells.map(parseCell);
        const old = (pr?.cells ?? []).map(parseCell);
        return (
          <div key={r.id} style={{ position: "absolute", left: 0, top: 0, ...(!pr && step > 0 ? { opacity: enter(since, 0, 14) } : {}) }}>
            <Abs x={X} y={cy - 2} w={LW - 20}>
              <div style={{ fontFamily: MONO, fontSize: 31, fontWeight: 800, color: dead ? C.red : C.text, lineHeight: 1.1 }}>{rs.label ?? r.label}</div>
              {(rs.sub ?? r.sub) && <div style={{ fontSize: 23, color: dead ? C.red : C.muted, marginTop: 6, lineHeight: 1.2 }}>{rs.sub ?? r.sub}</div>}
              {dead && (
                <div style={{ display: "inline-block", marginTop: 8, background: C.red, color: "#fff", fontWeight: 800, fontSize: 18, borderRadius: 7, padding: "3px 10px", opacity: step > 0 && !pr?.dead ? enter(since, 0, 12) : 1 }}>DOWN</div>
              )}
            </Abs>
            {cells.map((c, i) => {
              const o = old[i];
              const fresh = step > 0 && (!o || o.text !== c.text || o.mark !== c.mark);
              const kk = fresh ? enter(since, (i - old.length > 0 ? i - old.length : 0) * 4, 14) : 1;
              const ccol = c.mark === "+" ? C.green : c.mark === "!" ? C.red : c.mark === "*" ? C.amber : c.mark === "#" ? C.purple : col;
              const faded = c.mark === "~";
              const x = X + LW + i * CW;
              return (
                <div key={i} style={{ position: "absolute", left: x, top: cy, width: CW - 8, opacity: (dead ? 0.55 : 1) * (0.2 + 0.8 * kk), transform: `translateY(${(1 - kk) * -18}px)` }}>
                  <div style={{ fontFamily: MONO, fontSize: 20, color: C.faint, textAlign: "center", marginBottom: 4 }}>{c.off}</div>
                  <div
                    style={{
                      height: CH,
                      borderRadius: 9,
                      border: `2px solid ${faded ? C.line : ccol}`,
                      background: faded ? "transparent" : `${ccol}1f`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: MONO,
                      fontSize: Math.min(28, ((CW - 20) / Math.max(2, c.text.length)) * 1.6),
                      fontWeight: 700,
                      color: faded ? C.faint : C.text,
                      textDecoration: faded ? "line-through" : undefined,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.text}
                  </div>
                </div>
              );
            })}
            {/* the next free slot */}
            <div style={{ position: "absolute", left: X + LW + cells.length * CW, top: cy + 28, width: CW - 8, height: CH, borderRadius: 9, border: `2px dashed ${C.line}`, opacity: dead ? 0.3 : 0.7 }} />
            {(rs.ptrs ?? []).map((q, qi) => {
              const was = pr?.ptrs?.find((z) => z.l === q.l);
              const a = was ? lerp(was.at, q.at, k) : q.at;
              const pc = toneCol(q.tone);
              const px = X + LW + a * CW + (CW - 8) / 2;
              const below = !q.top;
              const py = below ? cy + 30 + CH + 4 : cy - 40;
              return (
                <div key={qi} style={{ position: "absolute", left: px - 160, top: py, width: 320, textAlign: "center", opacity: was ? 1 : step === 0 ? 1 : enter(since, 6, 14) }}>
                  {below && <div style={{ width: 0, height: 0, margin: "0 auto", borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderBottom: `12px solid ${pc}` }} />}
                  <div style={{ display: "inline-block", fontFamily: MONO, fontSize: 21, fontWeight: 800, color: "#0b0d10", background: pc, borderRadius: 6, padding: "2px 10px", marginTop: below ? 2 : 0, whiteSpace: "nowrap" }}>{q.l}</div>
                  {!below && <div style={{ width: 0, height: 0, margin: "2px auto 0", borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderTop: `12px solid ${pc}` }} />}
                </div>
              );
            })}
          </div>
        );
      })}
      {panel && ps && (ps.t || ps.b) && <Panel key={pi} s={ps} f={f} start={at(t, pi)} idx={numbered} />}
    </>
  );
};
