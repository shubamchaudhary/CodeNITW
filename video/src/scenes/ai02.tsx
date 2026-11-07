// Chapter 2 (RAG from scratch), told with a general example: an HR assistant
// answering from a company's 3,000 internal documents.
import { C, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, during } from "./custom3.tsx";
import { Arrow, Svg, type CP } from "./secui.tsx";

const Bubble = ({ user, children, f, start, color }: { user?: boolean; children: React.ReactNode; f: number; start: number; color?: string }) => {
  const p = Math.min(1, pop(f, start));
  return (
    <div style={{ alignSelf: user ? "flex-end" : "flex-start", maxWidth: 900, background: user ? C.blue : C.card2, color: user ? "#06101f" : (color ?? C.text), borderRadius: 24, borderBottomRightRadius: user ? 6 : 24, borderBottomLeftRadius: user ? 24 : 6, padding: "16px 26px", fontSize: 32, lineHeight: 1.32, fontWeight: user ? 600 : 500, opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>
      {children}
    </div>
  );
};

// ------------------------------------------------------------------ hook

export const A2Hook = ({ t }: CP) => {
  const f = t.frame;
  const ans = "Most companies offer around 12 weeks of parental leave. Check with HR for details.";
  const typed = ans.slice(0, Math.max(0, Math.floor((f - 40) * 1.5)));
  const s1 = at(t, 1);
  return (
    <>
      <Abs x={140} y={170} w={1160} style={{ ...card(), background: C.bg2, padding: "28px 34px", display: "flex", flexDirection: "column", gap: 20, opacity: enter(f, 2) }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>COMPANY HR ASSISTANT</div>
        <Bubble user f={f} start={8}>
          How many weeks of parental leave do I get?
        </Bubble>
        {f >= 40 && (
          <Bubble f={f} start={40} color={f >= s1 ? C.red : C.text}>
            {typed}
            {typed.length < ans.length && <span style={{ color: C.blue }}>▌</span>}
          </Bubble>
        )}
      </Abs>
      {t.step >= 1 && (
        <Abs x={140} y={560} w={1160} style={{ textAlign: "center" }}>
          <div style={{ display: "inline-block", border: `8px solid ${C.red}`, color: C.red, fontSize: 60, fontWeight: 900, letterSpacing: 3, padding: "6px 32px", borderRadius: 16, background: "rgba(12,16,24,0.88)", transform: `rotate(-5deg) scale(${2 - Math.min(1, pop(f, s1))})`, opacity: enter(f, s1, 5) }}>
            YOUR HANDBOOK SAYS 26
          </div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1360} y={300} w={460} style={{ textAlign: "center", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 120 }}>📘</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>Employee Handbook</div>
          <div style={{ fontSize: 26, color: C.muted }}>private · never in the training data</div>
          <div style={{ fontSize: 60, marginTop: 10 }}>🔒</div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={140} y={760} w={1160} style={{ textAlign: "center", ...rise(f, at(t, 3)) }}>
          <Chip color={C.green} style={{ fontSize: 36, padding: "12px 32px" }}>
            the fix you'll be asked about in every AI interview: RAG
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ open book

export const A2OpenBook = ({ t }: CP) => {
  const f = t.frame;
  const fly = t.step >= 1 ? ease(f, at(t, 1) + 10, 40) : 0;
  return (
    <>
      <Abs x={120} y={270} w={760} style={{ ...card(t.step === 0 ? C.red : C.line), padding: "30px 34px", textAlign: "center", opacity: t.step >= 2 ? 0.5 : 1, ...rise(f, 4) }}>
        <div style={{ fontSize: 40, fontWeight: 800 }}>📕 Closed-book exam</div>
        <div style={{ fontSize: 110, margin: "18px 0" }}>🤔</div>
        <div style={{ fontSize: 30, color: C.muted }}>answers from memory · guesses when unsure</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={1040} y={270} w={760} style={{ ...card(t.step === 1 ? C.green : C.line), padding: "30px 34px", textAlign: "center", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 40, fontWeight: 800 }}>📖 Open-book exam</div>
          <div style={{ position: "relative", height: 150, margin: "18px 0" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ position: "absolute", left: lerp(-300 + i * 60, 250 + i * 70, fly), top: lerp(-60, 20, fly) + i * 6, width: 90, height: 110, background: "#e9eef8", borderRadius: 6, transform: `rotate(${(i - 1) * 8}deg)`, boxShadow: "0 8px 20px rgba(0,0,0,0.4)", opacity: fly > 0 ? 1 : 0 }}>
                {[0, 1, 2, 3].map((l) => (
                  <div key={l} style={{ height: 6, margin: "14px 10px 0", background: "#b9c3d6", borderRadius: 3 }} />
                ))}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 30, color: C.muted }}>find the right pages first · answer from them</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={120} y={700} w={1680} style={{ display: "flex", gap: 40, justifyContent: "center", alignItems: "center" }}>
          <div style={{ ...card(C.blue), padding: "20px 30px", fontSize: 34, fontWeight: 800, ...rise(f, at(t, 2)) }}>1 · Retrieve: find the few relevant chunks</div>
          <div style={{ fontSize: 50, color: C.faint, ...rise(f, at(t, 2) + 10) }}>→</div>
          <div style={{ ...card(C.green), padding: "20px 30px", fontSize: 34, fontWeight: 800, ...rise(f, at(t, 2) + 16) }}>2 · Generate: answer only from them</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ keyword search

const KDOCS: [string, string, number[], boolean][] = [
  ["Time-off request form (HR-17)", "how to request time off in the HR portal", [1, 1], false],
  ["Office hours and time zones", "core hours, time off for public holidays", [1, 0], false],
  ["Parental leave policy", "employees get 26 weeks of paid parental leave…", [0, 0], true],
];

export const A2Keyword = ({ t }: CP) => {
  const f = t.frame;
  const swap = t.step >= 1 ? ease(f, at(t, 1) + 10, 24) : 0;
  return (
    <>
      <Abs x={80} y={170} w={1220} style={{ ...rise(f, 2) }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>QUESTION</div>
        <div style={{ fontSize: 42, fontWeight: 800, marginTop: 6 }}>
          How much <span style={{ color: C.amber }}>time off</span> do I get when my baby is born?
        </div>
      </Abs>
      {t.step < 3 &&
        KDOCS.map(([title, body, hits, right], i) => {
          const rank = right ? lerp(i, 2, swap) : i;
          const y = 360 + rank * 140;
          return (
            <Abs key={i} x={80} y={y} w={1220} style={{ ...card(right && t.step >= 2 ? C.green : i === 0 && t.step >= 1 ? C.red : C.line), padding: "16px 26px", display: "flex", alignItems: "center", gap: 24, opacity: enter(f, 10 + i * 6) }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: C.faint, width: 60 }}>#{right && t.step >= 1 ? 9 : i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 32, fontWeight: 800 }}>{title}</div>
                <div style={{ fontSize: 26, color: C.muted }}>{body}</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {["time", "off"].map((w, k) => (
                  <Chip key={w} color={hits[k] ? C.amber : C.line} style={{ fontSize: 22, color: hits[k] ? C.amber : C.faint }}>
                    {w} {hits[k] ? "✓" : "✗"}
                  </Chip>
                ))}
              </div>
            </Abs>
          );
        })}
      {t.step >= 3 && (
        <Abs x={80} y={360} w={1220} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {[
            ["“error E-4012 on login”", "finds the one page that names E-4012"],
            ["“form HR-17”", "exact code, exact match"],
          ].map(([q, a], i) => (
            <div key={i} style={{ ...card(C.green), padding: "20px 28px", ...rise(f, at(t, 3) + i * 12) }}>
              <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 700 }}>{q}</div>
              <div style={{ fontSize: 28, color: C.green, marginTop: 6 }}>✓ {a}</div>
            </div>
          ))}
          <div style={{ fontSize: 32, color: C.muted, fontWeight: 700, ...rise(f, at(t, 3) + 30) }}>keyword search still wins on codes, names and IDs: keep it (chapter 3)</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ map of meaning

const MAP: [string, number, number, string][] = [
  ["parental leave: 26 weeks", 0.2, 0.14, C.green],
  ["maternity leave start date", 0.12, 0.58, C.green],
  ["sick leave policy", 0.38, 0.62, C.green],
  ["travel reimbursement", 0.7, 0.2, C.amber],
  ["per diem rates", 0.82, 0.36, C.amber],
  ["reset your VPN", 0.62, 0.75, C.purple],
  ["new laptop request", 0.85, 0.66, C.purple],
];

export const A2Meaning = ({ t }: CP) => {
  const f = t.frame;
  const M = { x: 560, y: 290, w: 1260, h: 560 };
  const P = (x: number, y: number) => ({ x: M.x + x * M.w, y: M.y + y * M.h });
  const q = P(0.24, 0.36);
  const drop = t.step >= 2 ? ease(f, at(t, 2) + 6, 30) : 0;
  const ring = t.step >= 3 ? ease(f, at(t, 3), 30) : 0;
  return (
    <>
      <Abs x={80} y={170} w={1220} style={{ display: "flex", alignItems: "center", gap: 20, ...rise(f, 2) }}>
        <div style={{ ...card(), padding: "10px 20px", fontSize: 28, fontWeight: 700 }}>any text</div>
        <div style={{ fontSize: 34, color: C.faint }}>→</div>
        <div style={{ ...card(C.purple), padding: "10px 20px", fontSize: 28, fontWeight: 800 }}>embedding model</div>
        <div style={{ fontSize: 34, color: C.faint }}>→</div>
        <div style={{ fontFamily: MONO, fontSize: 26, color: C.cyan }}>[0.12, −0.48, 0.91, … 1,024 numbers]</div>
      </Abs>
      <Svg>
        <rect x={M.x} y={M.y} width={M.w} height={M.h} rx={22} fill={C.card} stroke={C.line} strokeWidth={2} opacity={t.step >= 1 ? enter(f, at(t, 1)) : 0} />
        {ring > 0 && <circle cx={q.x} cy={q.y} r={235 * ring} fill={`${C.green}18`} stroke={C.green} strokeWidth={3} strokeDasharray="10 8" />}
      </Svg>
      {t.step >= 1 &&
        MAP.map(([w, x, y, col], i) => {
          const p = P(x, y);
          return (
            <Abs key={w} x={p.x - 150} y={p.y - 20} w={300} style={{ textAlign: "center", opacity: Math.min(1, pop(f, at(t, 1) + i * 5)) }}>
              <span style={{ background: `${col}2a`, border: `2px solid ${col}`, borderRadius: 10, padding: "4px 12px", fontSize: 24, fontWeight: 700, whiteSpace: "nowrap" }}>{w}</span>
            </Abs>
          );
        })}
      {t.step >= 2 && (
        <Abs x={lerp(80, q.x - 230, drop)} y={lerp(300, q.y - 22, drop)} w={460} style={{ textAlign: "center", opacity: enter(f, at(t, 2)) }}>
          <span style={{ background: C.blue, color: "#06101f", borderRadius: 12, padding: "6px 14px", fontSize: 26, fontWeight: 800, whiteSpace: "nowrap" }}>❓ time off when my baby is born</span>
        </Abs>
      )}
      {t.step === 0 && (
        <Abs x={80} y={330} w={1100} style={{ fontSize: 34, color: C.muted, lineHeight: 1.4, ...rise(f, 20) }}>
          similar meaning → nearby numbers, even with <b style={{ color: C.text }}>no shared words</b>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={330} w={440} style={{ ...card(C.green), padding: "20px 24px", ...rise(f, at(t, 3) + 10) }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.green }}>nearest 3</div>
          {["parental leave: 26 weeks", "maternity leave start date", "sick leave policy"].map((x, i) => (
            <div key={x} style={{ fontSize: 26, marginTop: 10, opacity: enter(f, at(t, 3) + 20 + i * 8) }}>
              {i + 1}. {x}
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ cosine, dot, L2

export const A2Cosine = ({ t }: CP) => {
  const f = t.frame;
  const O = { x: 360, y: 760 };
  const norm = t.step >= 3 ? ease(f, at(t, 3) + 6, 30) : 0;
  const A = { x: 420, y: -330 };
  const B = { x: 560, y: -150 };
  const la = Math.hypot(A.x, A.y);
  const lb = Math.hypot(B.x, B.y);
  const R = 300;
  const a = { x: lerp(A.x, (A.x / la) * R, norm), y: lerp(A.y, (A.y / la) * R, norm) };
  const b = { x: lerp(B.x, (B.x / lb) * R, norm), y: lerp(B.y, (B.y / lb) * R, norm) };
  const rows: [string, string, string, string][] = [
    ["Cosine similarity", "same direction? ignores length", "a·b / (|a| |b|)", C.blue],
    ["Dot product", "direction and length", "Σ aᵢ · bᵢ", C.green],
    ["Euclidean (L2)", "straight-line distance", "|a − b|", C.purple],
  ];
  return (
    <>
      <Svg>
        <circle cx={O.x} cy={O.y} r={R} fill="none" stroke={C.line} strokeWidth={2} strokeDasharray="6 8" opacity={norm} />
        <Arrow x1={O.x} y1={O.y} x2={O.x + a.x} y2={O.y + a.y} color={C.blue} p={ease(f, 6, 20)} />
        <Arrow x1={O.x} y1={O.y} x2={O.x + b.x} y2={O.y + b.y} color={C.pink} p={ease(f, 14, 20)} />
        {t.step === 0 && <path d={`M ${O.x + 120 * Math.cos(Math.atan2(A.y, A.x))} ${O.y + 120 * Math.sin(Math.atan2(A.y, A.x))} A 120 120 0 0 1 ${O.x + 120 * Math.cos(Math.atan2(B.y, B.x))} ${O.y + 120 * Math.sin(Math.atan2(B.y, B.x))}`} stroke={C.amber} strokeWidth={5} fill="none" opacity={enter(f, 24)} />}
        {t.step === 2 && <line x1={O.x + a.x} y1={O.y + a.y} x2={O.x + b.x} y2={O.y + b.y} stroke={C.purple} strokeWidth={5} strokeDasharray="10 8" opacity={enter(f, at(t, 2))} />}
      </Svg>
      <Abs x={O.x + a.x - 40} y={O.y + a.y - 56} w={240} style={{ fontSize: 28, fontWeight: 800, color: C.blue }}>
        question
      </Abs>
      <Abs x={O.x + b.x + 14} y={O.y + b.y - 18} w={240} style={{ fontSize: 28, fontWeight: 800, color: C.pink }}>
        chunk
      </Abs>
      {t.step === 0 && (
        <Abs x={O.x + 130} y={O.y - 120} w={60} style={{ fontSize: 34, fontWeight: 800, color: C.amber, opacity: enter(f, 24) }}>
          θ
        </Abs>
      )}
      <Abs x={1040} y={290} w={800} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {rows.map(([name, what, formula, col], i) => {
          if (t.step < i) return null;
          const on = t.step === i || (t.step === 3 && i !== 2);
          return (
            <div key={name} style={{ ...card(on ? col : C.line), padding: "16px 24px", opacity: t.step === 3 && i === 2 ? 0.6 : 1, ...rise(f, at(t, i)) }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 20 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: col }}>{name}</div>
                <div style={{ fontFamily: MONO, fontSize: 28 }}>{formula}</div>
              </div>
              <div style={{ fontSize: 26, color: C.muted, marginTop: 4 }}>{what}</div>
            </div>
          );
        })}
        {t.step >= 3 && (
          <div style={{ ...card(C.amber), padding: "16px 24px", fontSize: 30, fontWeight: 800, ...rise(f, at(t, 3) + 20) }}>
            normalise to length 1 → cosine = dot product, same ranking as L2
          </div>
        )}
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ contrastive training

const QS = ["parental leave weeks?", "reset my VPN?", "per diem in London?", "carry over leave?"];
const PS = ["26 weeks paid…", "VPN: open the portal…", "London: £60 a day…", "up to 5 days roll over…"];

export const A2Contrastive = ({ t }: CP) => {
  const f = t.frame;
  const train = t.step >= 2 ? ease(f, at(t, 2) + 10, 80) : 0;
  const cell = 150;
  const X = 560;
  const Y = 320;
  const sim = (r: number, c: number) => {
    const start = 0.3 + 0.4 * ((r * 7 + c * 3) % 5) / 5;
    const hard = r === 3 && c === 0;
    const end = r === c ? 0.95 : hard ? (t.step >= 3 ? 0.3 : 0.55) : 0.08;
    return lerp(start, end, train);
  };
  return (
    <>
      <Abs x={80} y={170} w={1220} style={{ fontSize: 30, color: C.muted, fontWeight: 700, ...rise(f, 2) }}>
        one training batch · rows: questions · columns: the passages that answered them
      </Abs>
      {QS.map((q, r) => (
        <Abs key={q} x={80} y={Y + r * cell + cell / 2 - 22} w={460} style={{ textAlign: "right", fontSize: 28, fontWeight: 700, opacity: enter(f, 6 + r * 4) }}>
          {q}
        </Abs>
      ))}
      {PS.map((p, c) => (
        <Abs key={p} x={X + c * cell} y={Y - 64} w={cell - 8} style={{ textAlign: "center", fontSize: 21, color: C.muted, lineHeight: 1.2, opacity: enter(f, 6 + c * 4) }}>
          {p}
        </Abs>
      ))}
      {QS.map((_, r) =>
        PS.map((__, c) => {
          const v = sim(r, c);
          const pos = r === c;
          const hard = r === 3 && c === 0 && t.step >= 3;
          const col = pos ? C.green : hard ? C.amber : C.red;
          const show = t.step >= 1 || pos;
          return (
            <Abs key={`${r}${c}`} x={X + c * cell} y={Y + r * cell} w={cell - 8} h={cell - 8} style={{ borderRadius: 14, background: show ? `${col}${Math.round(30 + v * 200).toString(16).padStart(2, "0")}` : C.card, border: `3px solid ${hard ? C.amber : show ? col : C.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 30, fontWeight: 800, opacity: enter(f, 10 + (r + c) * 3) }}>
              {v.toFixed(2)}
            </Abs>
          );
        }),
      )}
      <Abs x={1220} y={320} w={620} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ ...card(C.green), padding: "16px 22px", fontSize: 28, fontWeight: 700, ...rise(f, 20) }}>
          <span style={{ color: C.green }}>■</span> diagonal: real pairs → pull together
        </div>
        {t.step >= 1 && (
          <div style={{ ...card(C.red), padding: "16px 22px", fontSize: 28, fontWeight: 700, ...rise(f, at(t, 1)) }}>
            <span style={{ color: C.red }}>■</span> every other passage in the batch is a free wrong answer → push apart
          </div>
        )}
        {t.step >= 2 && (
          <div style={{ fontSize: 28, color: C.muted, fontWeight: 700, ...rise(f, at(t, 2)) }}>
            training step {Math.round(train * 10000).toLocaleString("en-US")} · loss {lerp(2.1, 0.12, train).toFixed(2)}
          </div>
        )}
        {t.step >= 3 && (
          <div style={{ ...card(C.amber), padding: "16px 22px", fontSize: 28, fontWeight: 700, ...rise(f, at(t, 3)) }}>
            <span style={{ color: C.amber }}>■</span> hard negative: “carry over leave” vs “26 weeks parental leave”: similar words, wrong answer
          </div>
        )}
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ one vector vs chunks

const TOPICS: [string, string][] = [
  ["leave", C.green],
  ["expenses", C.amber],
  ["IT", C.purple],
  ["conduct", C.pink],
];

export const A2OneVector = ({ t }: CP) => {
  const f = t.frame;
  const M = { x: 760, y: 280, w: 1060, h: 560 };
  const P = (x: number, y: number) => ({ x: M.x + x * M.w, y: M.y + y * M.h });
  const q = P(0.16, 0.22);
  const avg = P(0.5, 0.52);
  const split = t.step >= 2 ? ease(f, at(t, 2), 40) : 0;
  const spots = [
    [0.18, 0.28],
    [0.1, 0.4],
    [0.82, 0.2],
    [0.74, 0.32],
    [0.8, 0.8],
    [0.66, 0.86],
    [0.22, 0.82],
    [0.32, 0.7],
  ];
  return (
    <>
      <Abs x={80} y={300} w={560} style={{ ...card(), padding: "26px 30px", ...rise(f, 4) }}>
        <div style={{ fontSize: 34, fontWeight: 800 }}>📘 Employee Handbook</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>40 pages</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          {TOPICS.map(([n, col]) => (
            <Chip key={n} color={col} style={{ fontSize: 24 }}>
              {n}
            </Chip>
          ))}
        </div>
        {t.step >= 2 && <div style={{ fontSize: 28, color: C.green, fontWeight: 800, marginTop: 18, ...rise(f, at(t, 2)) }}>✂ cut into ~100 chunks</div>}
      </Abs>
      <Svg>
        <rect x={M.x} y={M.y} width={M.w} height={M.h} rx={22} fill={C.card} stroke={C.line} strokeWidth={2} opacity={enter(f, 6)} />
        {t.step === 1 && <line x1={q.x} y1={q.y} x2={avg.x} y2={avg.y} stroke={C.red} strokeWidth={4} strokeDasharray="10 8" opacity={enter(f, at(t, 1))} />}
        {t.step >= 2 && <line x1={q.x} y1={q.y} x2={P(0.18, 0.28).x} y2={P(0.18, 0.28).y} stroke={C.green} strokeWidth={4} opacity={enter(f, at(t, 2) + 40)} />}
      </Svg>
      {split < 1 && (
        <Abs x={avg.x - 26} y={avg.y - 26} w={52} h={52} style={{ borderRadius: 999, background: `conic-gradient(${C.green} 0 25%, ${C.amber} 0 50%, ${C.purple} 0 75%, ${C.pink} 0)`, opacity: enter(f, 10) * (1 - split) }} />
      )}
      {split > 0 &&
        spots.map(([x, y], i) => {
          const p = P(x, y);
          return <Abs key={i} x={lerp(avg.x, p.x, split) - 16} y={lerp(avg.y, p.y, split) - 16} w={32} h={32} style={{ borderRadius: 999, background: TOPICS[Math.floor(i / 2)][1] }} />;
        })}
      <Abs x={q.x - 110} y={q.y - 70} w={220} style={{ textAlign: "center", fontSize: 26, fontWeight: 800, color: C.blue, opacity: enter(f, 14) }}>
        ❓ leave question
      </Abs>
      <Abs x={q.x - 12} y={q.y - 12} w={24} h={24} style={{ borderRadius: 999, background: C.blue, opacity: enter(f, 14) }} />
      {t.step === 1 && (
        <Abs x={avg.x - 260} y={avg.y + 40} w={520} style={{ textAlign: "center", fontSize: 28, color: C.red, fontWeight: 800, ...rise(f, at(t, 1)) }}>
          one point = the average of everything: close to nothing
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={640} w={620} style={{ ...card(C.amber), padding: "20px 26px", ...rise(f, at(t, 3)) }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>but a chunk can be too small:</div>
          <div style={{ fontFamily: MONO, fontSize: 26, marginTop: 8 }}>“It is 26 weeks for the primary carer.”</div>
          <div style={{ fontSize: 26, color: C.amber, marginTop: 6 }}>what is “it”?</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ ways to cut

const SRC = "Parental leave. Employees get 26 weeks of paid parental leave. Leave can start 4 weeks before the due date. Expenses. Travel is reimbursed within 30 days. Submit receipts in the expense tool.";

const fixed = (n: number, overlap = 0) => {
  const out: string[] = [];
  for (let i = 0; i < SRC.length; i += n - overlap) {
    out.push(SRC.slice(i, i + n));
    if (i + n >= SRC.length) break;
  }
  return out;
};

export const A2Chunkers = ({ t }: CP) => {
  const f = t.frame;
  const st = Math.min(3, t.step);
  const methods: { name: string; chunks: string[]; note: string; col: string }[] = [
    { name: "Fixed size", chunks: fixed(48), note: "every 48 characters: cuts words and sentences in half", col: C.red },
    { name: "Fixed size + overlap", chunks: fixed(56, 14), note: "neighbours share an edge, so a cut sentence survives in one of them", col: C.amber },
    {
      name: "Recursive",
      chunks: ["Parental leave. Employees get 26 weeks of paid parental leave. Leave can start 4 weeks before the due date.", "Expenses. Travel is reimbursed within 30 days. Submit receipts in the expense tool."],
      note: "try paragraphs, then sentences, then words, until each piece fits",
      col: C.green,
    },
    {
      name: "Semantic",
      chunks: ["Parental leave. Employees get 26 weeks of paid parental leave. Leave can start 4 weeks before the due date.", "Expenses. Travel is reimbursed within 30 days. Submit receipts in the expense tool."],
      note: "embed each sentence; cut where neighbours stop being similar (0.81 → 0.19)",
      col: C.purple,
    },
  ];
  const m = methods[st];
  return (
    <>
      <Abs x={80} y={170} w={1220} style={{ ...card(), padding: "18px 24px", fontSize: 26, color: C.muted, lineHeight: 1.4, ...rise(f, 2) }}>
        {SRC}
      </Abs>
      <Abs key={st} x={80} y={390} w={1760} style={{ ...rise(f, at(t, st)) }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
          <div style={{ fontSize: 40, fontWeight: 900, color: m.col }}>{m.name}</div>
          <div style={{ fontSize: 28, color: C.muted }}>{m.note}</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 20 }}>
          {m.chunks.map((c, i) => (
            <div key={i} style={{ ...card(PALETTE[i % PALETTE.length]), padding: "10px 16px", fontFamily: MONO, fontSize: st >= 2 ? 26 : 23, maxWidth: st >= 2 ? 860 : 560, lineHeight: 1.35, whiteSpace: "pre-wrap", opacity: enter(f, at(t, st) + 8 + i * 5) }}>
              {c}
            </div>
          ))}
        </div>
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ parent-child

export const A2Parent = ({ t }: CP) => {
  const f = t.frame;
  const kids = ["Employees get 26 weeks of paid parental leave.", "Leave can start 4 weeks before the due date.", "Partners get 4 weeks, taken within a year.", "Tell your manager 8 weeks in advance."];
  const hit = 0;
  return (
    <>
      <Abs x={80} y={250} w={1000} style={{ ...card(t.step >= 2 ? C.green : C.line), padding: "24px 28px", ...rise(f, 4) }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>PARENT · HANDBOOK §4.2 PARENTAL LEAVE</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          {kids.map((k, i) => (
            <div key={i} style={{ ...card(t.step >= 1 && i === hit ? C.blue : C.line), padding: "10px 18px", fontSize: 27, boxShadow: t.step >= 1 && i === hit ? `0 0 30px ${C.blue}66` : undefined, opacity: enter(f, 10 + i * 5) }}>
              {k}
            </div>
          ))}
        </div>
      </Abs>
      <Abs x={1140} y={270} w={700} style={{ fontSize: 30, lineHeight: 1.4, ...rise(f, 14) }}>
        <b>children</b>: small, sharp chunks → <span style={{ color: C.blue }}>embedded and searched</span>
      </Abs>
      {t.step >= 1 && (
        <Abs x={1140} y={400} w={700} style={{ ...card(C.blue), padding: "16px 22px", fontSize: 28, ...rise(f, at(t, 1)) }}>
          ❓ “how long is parental leave?” matches child 1
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1140} y={540} w={700} style={{ ...card(C.green), padding: "16px 22px", fontSize: 28, ...rise(f, at(t, 2)) }}>
          📤 the model receives the <b>whole parent</b>: the 26 weeks, the start date, the notice rule
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ contextual retrieval

export const A2Context = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      <Abs x={80} y={250} w={1220} style={{ ...card(), padding: "22px 28px", ...rise(f, 4) }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>CHUNK AS STORED</div>
        <div style={{ fontFamily: MONO, fontSize: 30, marginTop: 10, lineHeight: 1.4 }}>
          {t.step >= 1 && <span style={{ color: C.green, background: `${C.green}22`, ...rise(f, at(t, 1) + 20) }}>[From the 2026 Employee Handbook, §4.2 Parental leave.] </span>}
          It is 26 weeks for the primary carer, paid at full salary.
        </div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={80} y={470} w={1220} style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 28, ...rise(f, at(t, 1)) }}>
          <div style={{ ...card(C.purple), padding: "12px 18px", fontWeight: 800 }}>LLM reads chunk + whole document</div>
          <div style={{ color: C.faint, fontSize: 34 }}>→</div>
          <div style={{ color: C.muted }}>writes one placing sentence, glued on before embedding</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={80} y={600} w={1760} style={{ display: "flex", gap: 30 }}>
          {[
            ["−35%", "failed retrievals", "contextual embeddings"],
            ["−49%", "failed retrievals", "+ contextual keyword index"],
          ].map(([v, a, b], i) => (
            <div key={i} style={{ ...card(C.green), padding: "20px 30px", minWidth: 420, ...rise(f, at(t, 2) + i * 14) }}>
              <div style={{ fontSize: 70, fontWeight: 900, color: C.green }}>{v}</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{a}</div>
              <div style={{ fontSize: 24, color: C.muted }}>{b} · Anthropic, 2024</div>
            </div>
          ))}
          {t.step >= 3 && (
            <div style={{ ...card(C.amber), padding: "20px 30px", flex: 1, ...rise(f, at(t, 3)) }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: C.amber }}>the cost</div>
              <div style={{ fontSize: 28, marginTop: 8, lineHeight: 1.35 }}>one LLM call per chunk, once, at indexing time; prompt caching makes the repeated document cheap</div>
            </div>
          )}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the RAG prompt

export const A2Prompt = ({ t }: CP) => {
  const f = t.frame;
  const blocks: [string, string, string, number][] = [
    ["Instructions", "Answer only from the documents below. If they don't answer it, say so. Cite the id of every passage you use.", C.blue, 0],
    ["Documents, each with id and date", "[hb-2026:4.2 | Employee Handbook | updated 2026-03-01] Employees get 26 weeks…", C.green, 1],
    ["", "[faq:17 | HR FAQ | updated 2024-11-12] Parental leave is 16 weeks…", C.green, 1],
    ["Question, last", "How many weeks of parental leave do I get?", C.amber, 2],
  ];
  const budget: [string, number, string][] = [
    ["instructions", 800, C.blue],
    ["5 chunks", 2000, C.green],
    ["chat", 500, C.purple],
    ["q", 100, C.amber],
    ["answer", 500, C.pink],
  ];
  const total = budget.reduce((a, b) => a + b[1], 0);
  return (
    <>
      <Abs x={80} y={230} w={1220} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {blocks.map(([label, text, col, st], i) => {
          if (t.step < st) return null;
          return (
            <div key={i} style={{ ...card(t.step === st ? col : C.line), padding: "12px 22px", ...rise(f, at(t, st) + (i === 2 ? 10 : 0)) }}>
              {label && <div style={{ fontSize: 22, fontWeight: 800, color: col, letterSpacing: 1 }}>{label.toUpperCase()}</div>}
              <div style={{ fontFamily: MONO, fontSize: 24, marginTop: 4, lineHeight: 1.35 }}>{text}</div>
            </div>
          );
        })}
      </Abs>
      {t.step >= 3 && (
        <Abs x={1340} y={290} w={500} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            ["⚡", "fixed part first → prompt caching"],
            ["📅", "dates → prefer the newer passage"],
            ["🧹", "drop near-duplicates"],
          ].map(([i, s], k) => (
            <div key={k} style={{ ...card(), padding: "14px 20px", fontSize: 27, fontWeight: 700, ...rise(f, at(t, 3) + k * 10) }}>
              {i} {s}
            </div>
          ))}
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={80} y={740} w={1760} style={{ ...rise(f, at(t, 4)) }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.muted, letterSpacing: 2, marginBottom: 10 }}>TOKEN BUDGET FOR ONE CALL · ≈ {total.toLocaleString("en-US")}</div>
          <div style={{ display: "flex", gap: 4 }}>
            {budget.map(([n, v, col], i) => (
              <div key={n} style={{ width: (1760 * v) / total - 4, height: 56, borderRadius: 10, background: `${col}55`, border: `2px solid ${col}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, overflow: "hidden", whiteSpace: "nowrap", opacity: enter(f, at(t, 4) + i * 6) }}>
                {v > 300 ? `${n} ${v}` : ""}
              </div>
            ))}
          </div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ updates

export const A2Update = ({ t }: CP) => {
  const f = t.frame;
  const box = (x: number, title: string, chunks: [string, string][], col: string) => (
    <Abs x={x} y={300} w={520} style={{ ...card(col), padding: "18px 22px" }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
        {chunks.map(([v, s], i) => (
          <div key={i} style={{ fontFamily: MONO, fontSize: 24, padding: "6px 12px", borderRadius: 8, background: v === "v3" ? `${C.red}22` : `${C.green}22`, border: `2px solid ${v === "v3" ? C.red : C.green}`, textDecoration: v === "v3" && t.step === 2 ? "line-through" : "none" }}>
            {v} · {s}
          </div>
        ))}
      </div>
    </Abs>
  );
  const old: [string, string][] = [
    ["v3", "parental leave: 16 weeks"],
    ["v3", "notice: 4 weeks"],
  ];
  const neu: [string, string][] = [
    ["v4", "parental leave: 26 weeks"],
    ["v4", "notice: 8 weeks"],
  ];
  const index = t.step === 0 ? old : t.step === 1 ? [...old, ...neu] : t.step === 2 ? [...old, ...neu] : neu;
  return (
    <>
      {t.step < 4 && (
        <>
          <Abs x={80} y={180} w={1220} style={{ fontSize: 34, fontWeight: 800, ...rise(f, 2) }}>
            Handbook updated: <span style={{ color: C.red }}>v3</span> → <span style={{ color: C.green }}>v4</span>
          </Abs>
          {box(80, "VECTOR INDEX", index, t.step === 1 ? C.red : C.line)}
          {box(660, "KEYWORD INDEX", index, t.step === 1 ? C.red : C.line)}
        </>
      )}
      {t.step === 1 && (
        <Abs x={1260} y={300} w={580} style={{ ...card(C.red), padding: "20px 26px", opacity: during(t, 1) }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.red }}>✗ added v4, forgot to delete v3</div>
          <div style={{ fontSize: 27, color: C.muted, marginTop: 8, lineHeight: 1.35 }}>“16 weeks” and “26 weeks” both found; answers mix versions. A deleted or restricted doc stays searchable: a data leak.</div>
        </Abs>
      )}
      {t.step >= 2 && t.step < 4 && (
        <Abs x={1260} y={300} w={580} style={{ ...card(C.green), padding: "20px 26px", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.green }}>✓ one operation per doc_id</div>
          <div style={{ fontSize: 27, color: C.muted, marginTop: 8, lineHeight: 1.35 }}>re-chunk, embed, insert v4, delete every v3 chunk, in both indexes. Triggered by a webhook, or a nightly hash check.</div>
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={80} y={260} w={1760} style={{ ...rise(f, at(t, 4)) }}>
          <div style={{ fontSize: 34, fontWeight: 800 }}>New embedding model or chunk size? Rebuild beside the old one.</div>
          <div style={{ display: "flex", gap: 40, marginTop: 40, alignItems: "center" }}>
            <div style={{ ...card(C.blue), padding: "26px 34px", fontSize: 34, fontWeight: 800, opacity: 1 - 0.5 * ease(f, at(t, 4) + 60, 20) }}>🔵 index A (live)</div>
            <div style={{ ...card(C.green), padding: "26px 34px", fontSize: 34, fontWeight: 800 }}>🟢 index B: built, tested on 80 questions</div>
          </div>
          <div style={{ fontSize: 32, color: C.green, fontWeight: 800, marginTop: 36, opacity: enter(f, at(t, 4) + 60) }}>→ switch queries to B in one step · keep A for rollback</div>
        </Abs>
      )}
    </>
  );
};


