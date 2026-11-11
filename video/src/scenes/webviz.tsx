// Pictures for the JavaScript, React and Node.js lectures (JS-01, RE-01,
// ND-01): a question answered point by point, with an optional code panel;
// and columns of chips that change per step (the event loop's stack and
// queues, Node's loop phases, a render's stages).
import { C, MONO, tone } from "../lib/theme.ts";
import { enter, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at } from "./custom3.tsx";
import type { CP } from "./secui.tsx";
import { Note, Title } from "./py.tsx";

const COLS = ["#ff8a3d", "#2dd4bf", "#ffd166", "#ff6fa5", "#38d996", "#a78bfa", "#5b9cff", "#ff6262"];
const colOf = (s: string) => COLS[[...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % COLS.length];

// ------------------------------------------------------------------ a question, answered point by point

// Beat 0 reads the question; beat i shows lines[i - 1]. A `code` panel (shown
// from beat 0, or from `codeAt`) sits on the right.
export const WebQA = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { n: number; q: string; lines: string[]; code?: string; codeAt?: number; codeTitle?: string };
  const hasCode = !!p.code;
  const lw = hasCode ? 960 : 1760;
  const codeLines = (p.code ?? "").split("\n");
  const longest = Math.max(...codeLines.map((l) => l.length));
  const fs = Math.min(25, Math.floor(1130 / Math.max(30, longest)), Math.floor(560 / Math.max(1, codeLines.length) / 1.4));
  const lineFs = p.lines.length > 4 || p.lines.some((l) => l.length > 110) ? 28 : 31;
  return (
    <>
      <Abs x={80} y={118} w={1240} style={rise(f, 2)}>
        <Chip color={C.blue} style={{ fontSize: 22, padding: "6px 16px" }}>QUESTION {p.n}</Chip>
        <div style={{ fontSize: p.q.length > 80 ? 38 : 44, fontWeight: 800, marginTop: 14, lineHeight: 1.2, fontFamily: C.head }}>{p.q}</div>
      </Abs>
      <Abs x={80} y={330} w={lw} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {p.lines.map((ln, i) => {
          const st = i + 1;
          if (t.step < st) return null;
          const on = t.step === st;
          return (
            <div key={i} style={{ ...card(on ? C.blue : undefined), padding: "14px 22px", display: "flex", gap: 16, alignItems: "baseline", fontSize: lineFs, lineHeight: 1.3, color: on ? C.text : C.muted, fontWeight: on ? 650 : 500, ...rise(f, at(t, st), 16) }}>
              <span style={{ color: C.blue, fontWeight: 800, fontSize: 24, flexShrink: 0 }}>{i + 1}</span>
              <span>{ln}</span>
            </div>
          );
        })}
      </Abs>
      {hasCode && t.step >= (p.codeAt ?? 0) && (
        <Abs x={1080} y={330} w={760} style={{ ...card(C.line), padding: "18px 24px", background: C.bg2, ...rise(f, at(t, p.codeAt ?? 0) + 4, 14) }}>
          {p.codeTitle && <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1.5, color: C.muted, marginBottom: 10 }}>{p.codeTitle}</div>}
          <pre style={{ margin: 0, fontFamily: MONO, fontSize: fs, lineHeight: 1.4, color: C.text, whiteSpace: "pre" }}>
            {codeLines.map((l, i) => (
              <div key={i} style={{ color: /^\s*(\/\/|#)/.test(l) ? C.faint : C.text }}>{l || " "}</div>
            ))}
          </pre>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ columns of chips

// Columns (a call stack, queues, phases); each step gives every column's
// chips (a stack column draws bottom-up), an optional output line and a note.
type CStep = { cols: string[][]; out?: string; note?: string; hl?: number };
export const ChipCols = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { title: string; sub?: string; cols: { title: string; sub?: string; stack?: boolean; tone?: string }[]; steps: CStep[]; outLabel?: string };
  const si = Math.min(t.step, p.steps.length - 1);
  const s = p.steps[si];
  const st = at(t, si);
  const n = p.cols.length;
  const gap = 26;
  const w = Math.floor((1760 - gap * (n - 1)) / n);
  const top = 262;
  const h = 470;
  const chipH = 62;
  return (
    <>
      <Title text={p.title} f={f} sub={p.sub} />
      {p.cols.map((c, i) => {
        const x = 80 + i * (w + gap);
        const col = tone(c.tone ?? ["blue", "cyan", "amber", "pink", "green"][i % 5]);
        const items = s.cols[i] ?? [];
        const lit = s.hl === i;
        return (
          <div key={i}>
            <Abs x={x} y={top} w={w} style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1.5, color: lit ? col : C.muted, ...rise(f, 4 + i * 3, 12) }}>
              {c.title}
              {c.sub && <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: 0, color: C.faint, marginTop: 2 }}>{c.sub}</div>}
            </Abs>
            <Abs x={x} y={top + 64} w={w} h={h} style={{ ...card(lit ? col : C.line), background: lit ? `${col}12` : C.card, opacity: enter(f, 4 + i * 3, 12), display: "flex", flexDirection: c.stack ? "column-reverse" : "column", gap: 12, padding: 14, boxSizing: "border-box" }}>
              {items.map((it, k) => (
                <div key={`${si}-${k}-${it}`} style={{ height: chipH, flexShrink: 0, borderRadius: 12, border: `2px solid ${colOf(it)}`, background: `${colOf(it)}1f`, display: "flex", alignItems: "center", padding: "0 14px", fontFamily: MONO, fontSize: it.length > 22 ? 18 : 22, fontWeight: 700, overflow: "hidden", whiteSpace: "nowrap", ...rise(f, st + 4 + k * 3, 10) }}>
                  {it}
                </div>
              ))}
            </Abs>
          </div>
        );
      })}
      {s.out !== undefined && (
        <Abs x={80} y={top + h + 84} w={1760} style={{ display: "flex", alignItems: "center", gap: 16, ...rise(f, st + 8, 10) }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1.5, color: C.muted }}>{p.outLabel ?? "OUTPUT"}</span>
          <span style={{ ...card(C.green), padding: "10px 22px", fontFamily: MONO, fontSize: 28, fontWeight: 700 }}>{s.out || " "}</span>
        </Abs>
      )}
      {s.note && <Note key={`n${si}`} text={s.note} f={f} start={st + 16} y={s.out !== undefined ? 886 : 826} />}
    </>
  );
};
