// Chapter 1 (How an LLM works), told with general examples: one sentence
// ("The capital of France is") followed through the whole machine.
import type { Clock } from "../lib/timeline.ts";
import { C, DEVA, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise, softmax } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, Big, clamp01, during, rnd } from "./custom3.tsx";
import { Arrow, Svg, type CP } from "./secui.tsx";

const since = (t: Clock, i: number) => t.frame - at(t, i);

// A token as a chip: the leading space of a token is shown as a dot.
const Tok = ({ s, color = C.blue, size = 36, dim, style }: { s: string; color?: string; size?: number; dim?: boolean; style?: React.CSSProperties }) => (
  <div style={{ display: "inline-flex", alignItems: "center", fontFamily: MONO, fontSize: size, fontWeight: 600, padding: "6px 14px", borderRadius: 12, background: `${color}26`, border: `2px solid ${color}`, color: dim ? C.faint : C.text, whiteSpace: "pre", ...style }}>
    {s.startsWith(" ") ? <span style={{ color: C.faint }}>·</span> : null}
    {s.trimStart()}
  </div>
);

// ------------------------------------------------------------------ hook

export const A1Hook = ({ t }: CP) => {
  const f = t.frame;
  const up = ease(f, at(t, 2), 30);
  const stations = [
    ["🔤", "Tokens"],
    ["📍", "Vectors"],
    ["🔦", "Attention × 32"],
    ["🎲", "Probabilities"],
    ["✅", "“Paris”"],
  ];
  const lit = t.step >= 2 ? Math.floor((f - at(t, 2) - 30) / 16) : -1;
  return (
    <>
      <Abs x={210} y={lerp(260, 140, up)} w={1500} style={{ textAlign: "center", transform: `scale(${1 - 0.22 * up})`, ...rise(f, 4) }}>
        <Chip color={C.amber}>INTERVIEW QUESTION</Chip>
        <Big size={66} style={{ marginTop: 26 }}>
          “What happens between pressing <span style={{ color: C.blue }}>Enter</span> and the first word appearing?”
        </Big>
      </Abs>
      {t.step === 1 && (
        <Abs x={260} y={640} w={1400} style={{ textAlign: "center", opacity: during(t, 1) }}>
          <div style={{ fontSize: 40, color: C.muted, fontWeight: 600 }}>used every day · explained by very few</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <>
          <Abs x={0} y={450} w={1920} style={{ display: "flex", justifyContent: "center", ...rise(f, at(t, 2) + 8) }}>
            <Tok s="The capital of France is" size={44} />
          </Abs>
          <Svg>
            {stations.slice(0, -1).map((_, i) => (
              <Arrow key={i} x1={130 + i * 340 + 300 + 4} y1={690} x2={130 + (i + 1) * 340 - 4} y2={690} color={lit > i ? C.blue : C.line} p={1} />
            ))}
          </Svg>
          {stations.map(([icon, name], i) => {
            const on = lit >= i;
            return (
              <Abs key={i} x={130 + i * 340} y={600} w={300} style={{ ...card(on ? (i === 4 ? C.green : C.blue) : C.line), padding: "20px 10px", textAlign: "center", opacity: enter(f, at(t, 2) + 14 + i * 4), transform: `scale(${on ? 1 : 0.94})`, boxShadow: on ? `0 0 40px ${i === 4 ? C.green : C.blue}55` : undefined }}>
                <div style={{ fontSize: 50 }}>{icon}</div>
                <div style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{name}</div>
              </Abs>
            );
          })}
        </>
      )}
    </>
  );
};

// ------------------------------------------------------------------ next token

const CANDS: [string, number][] = [
  [" Paris", 0.92],
  [" a", 0.03],
  [" the", 0.02],
  [" located", 0.01],
  [" known", 0.01],
];
const GEN = [" Paris", ".", " It", " is", " famous", " for", " the", " Eiffel", " Tower", "."];

export const A1Next = ({ t }: CP) => {
  const f = t.frame;
  const n = t.step >= 2 ? Math.min(GEN.length, 1 + Math.floor(Math.max(0, since(t, 2) - 20) / 16)) : 0;
  const bars = t.step >= 1 ? 1 - enter(f, at(t, 2), 14) : 0;
  return (
    <>
      <Abs x={120} y={250} w={1700} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", ...rise(f, 4) }}>
        {["The", " capital", " of", " France", " is"].map((s, i) => (
          <Tok key={i} s={s} size={40} color={C.blue} />
        ))}
        {GEN.slice(0, n).map((s, i) => (
          <Tok key={`g${i}`} s={s} size={40} color={C.green} style={{ transform: `scale(${Math.min(1, pop(f, at(t, 2) + 20 + i * 16))})` }} />
        ))}
        {n < GEN.length && <div style={{ width: 6, height: 50, background: C.amber, opacity: Math.floor(f / 12) % 2 ? 1 : 0.2 }} />}
      </Abs>
      {bars > 0.01 &&
        CANDS.map(([s, p], i) => {
          const g = ease(f, at(t, 1) + i * 5, 26);
          return (
            <Abs key={i} x={260} y={420 + i * 84} w={1400} style={{ display: "flex", alignItems: "center", gap: 24, opacity: bars }}>
              <div style={{ width: 260, textAlign: "right", fontFamily: MONO, fontSize: 36, fontWeight: 700, color: i === 0 ? C.green : C.text }}>{s.trim()}</div>
              <div style={{ width: Math.max(6, 900 * p * g), height: 46, borderRadius: 10, background: i === 0 ? C.green : C.blue, opacity: i === 0 ? 1 : 0.7 }} />
              <div style={{ fontSize: 32, fontWeight: 800, color: C.muted, fontVariantNumeric: "tabular-nums" }}>{Math.round(p * 100 * g)}%</div>
            </Abs>
          );
        })}
      {t.step >= 2 && (
        <>
          <Abs x={260} y={520} w={1400} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40, opacity: enter(f, at(t, 2) + 10) }}>
            {[
              ["all the text so far", C.blue],
              ["LLM", C.purple],
              ["one next token", C.green],
            ].map(([txt, col], i) => (
              <div key={i} style={{ ...card(col), padding: "20px 0", fontSize: 30, fontWeight: 800, width: 360, textAlign: "center", whiteSpace: "nowrap" }}>
                {txt}
              </div>
            ))}
          </Abs>
          <Svg>
            <Arrow x1={744} y1={560} x2={776} y2={560} color={C.muted} />
            <Arrow x1={1144} y1={560} x2={1176} y2={560} color={C.muted} />
            <path d="M 1360 606 C 1360 700, 560 700, 560 616" stroke={C.green} strokeWidth={4} fill="none" strokeDasharray="10 8" opacity={enter(f, at(t, 2) + 20)} />
            <polygon points="560,604 549,622 571,622" fill={C.green} opacity={enter(f, at(t, 2) + 20)} />
          </Svg>
          <Abs x={760} y={696} w={400} style={{ textAlign: "center", fontSize: 30, fontWeight: 700, color: C.green, opacity: enter(f, at(t, 2) + 24) }}>
            append, run again
          </Abs>
          <Abs x={0} y={800} w={1920} style={{ textAlign: "center", opacity: enter(f, at(t, 2) + 24) }}>
            <Chip color={C.amber} style={{ fontSize: 30 }}>
              pass #{n} · one full run of the model per token
            </Chip>
          </Abs>
        </>
      )}
    </>
  );
};

// ------------------------------------------------------------------ practice (pretraining)

export const A1Practice = ({ t }: CP) => {
  const f = t.frame;
  const right = t.step >= 2 && since(t, 2) > 50;
  const turn = ease(f, at(t, 2), 50);
  const count = t.step >= 3 ? Math.min(15, 15 * ease(f, at(t, 3), 70)) : 0;
  return (
    <>
      <Abs x={140} y={180} w={1120} style={{ ...card(), padding: "30px 40px", ...rise(f, 4) }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 2, color: C.muted }}>A SENTENCE FROM THE INTERNET, LAST WORD HIDDEN</div>
        <div style={{ fontSize: 54, fontWeight: 800, marginTop: 14 }}>
          The Eiffel Tower is in{" "}
          <span style={{ display: "inline-block", minWidth: 220, borderBottom: `5px dashed ${C.amber}`, color: t.step >= 1 ? (right ? C.green : C.red) : C.amber }}>
            {t.step >= 1 ? (right ? "Paris ✓" : "London ✗") : "  ?  "}
          </span>
        </div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={140} y={470} w={560} style={{ ...card(C.red), padding: "24px 30px", ...rise(f, at(t, 1) + 6) }}>
          <div style={{ fontSize: 30, fontWeight: 800 }}>how wrong was it?</div>
          <div style={{ marginTop: 16, height: 30, borderRadius: 15, background: C.bg }}>
            <div style={{ height: 30, borderRadius: 15, width: `${(right ? 8 : 88) * ease(f, at(t, 1) + 10, 20)}%`, background: right ? C.green : C.red }} />
          </div>
          <div style={{ fontSize: 24, color: C.muted, marginTop: 12 }}>this number is the loss</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={800} y={460} w={980} style={{ display: "flex", flexWrap: "wrap", gap: 22, ...rise(f, at(t, 2)) }}>
          {Array.from({ length: 16 }, (_, i) => {
            const a = -120 + 240 * rnd(i + 3) + turn * (rnd(i + 40) - 0.5) * 80 + Math.sin((f + i * 9) / 7) * (turn < 1 ? 6 : 0);
            return (
              <svg key={i} width={100} height={100} viewBox="0 0 100 100">
                <circle cx={50} cy={50} r={40} fill={C.card} stroke={C.line} strokeWidth={4} />
                <line x1={50} y1={50} x2={50 + 30 * Math.sin((a * Math.PI) / 180)} y2={50 - 30 * Math.cos((a * Math.PI) / 180)} stroke={PALETTE[i % PALETTE.length]} strokeWidth={7} strokeLinecap="round" />
              </svg>
            );
          })}
          <div style={{ width: "100%", fontSize: 28, color: C.muted, fontWeight: 600 }}>parameters: billions of dials, each nudged a tiny bit</div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={140} y={710} w={600} style={{ ...rise(f, at(t, 3)) }}>
          <div style={{ fontSize: 26, color: C.muted, fontWeight: 700 }}>quizzes so far</div>
          <div style={{ fontSize: 76, fontWeight: 900, color: C.amber, fontVariantNumeric: "tabular-nums" }}>{count.toFixed(1)} trillion</div>
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={800} y={800} w={1000} style={{ display: "flex", gap: 18, ...rise(f, at(t, 4)) }}>
          {["facts", "grammar", "reasoning-like patterns"].map((x, i) => (
            <Chip key={x} color={[C.green, C.blue, C.purple][i]} style={{ fontSize: 30, opacity: enter(f, at(t, 4) + i * 10) }}>
              + {x}
            </Chip>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ tokenizer

const TOKS: [string, number][] = [
  ["Token", 3404],
  ["ization", 2065],
  [" isn", 4536],
  ["'t", 956],
  [" un", 653],
  ["believ", 32615],
  ["ably", 2915],
  [" hard", 2653],
];

export const A1Tokens = ({ t }: CP) => {
  const f = t.frame;
  const split = enter(f, 20, 20);
  const bpe = ["l o w e r", "lo w e r", "low e r", "low er", "lower"];
  return (
    <>
      <Abs x={80} y={170} w={1220} style={{ fontSize: 44, fontWeight: 800, opacity: 1 - split * 0.6, ...rise(f, 2) }}>
        “Tokenization isn't unbelievably hard”
      </Abs>
      <Abs x={80} y={280} w={1760} style={{ display: "flex", gap: 14 * split + 2, flexWrap: "wrap" }}>
        {TOKS.map(([s, id], i) => {
          const hot = t.step === 1 && i >= 4 && i <= 6;
          return (
            <div key={i} style={{ textAlign: "center", opacity: enter(f, 18 + i * 4), transform: `translateY(${hot ? -12 : 0}px)` }}>
              <Tok s={s} size={38} color={hot ? C.amber : PALETTE[i % PALETTE.length]} />
              <div style={{ fontFamily: MONO, fontSize: 24, color: C.muted, marginTop: 8 }}>{id}</div>
            </div>
          );
        })}
      </Abs>
      {t.step === 2 && (
        <Abs x={80} y={480} w={1760} style={{ ...card(C.purple), padding: "24px 34px", opacity: during(t, 2) }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.purple }}>byte-pair encoding: merge the most frequent pair, again and again</div>
          <div style={{ display: "flex", gap: 30, alignItems: "center", marginTop: 20, flexWrap: "wrap" }}>
            {bpe.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 30, opacity: enter(f, at(t, 2) + 20 + i * 22) }}>
                <div style={{ fontFamily: MONO, fontSize: 40, fontWeight: 700, color: i === bpe.length - 1 ? C.green : C.text, whiteSpace: "pre" }}>{b}</div>
                {i < bpe.length - 1 && <div style={{ fontSize: 36, color: C.faint }}>→</div>}
              </div>
            ))}
          </div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={480} w={1760} style={{ display: "flex", gap: 30 }}>
          {[
            ["letters", "sequences far too long", C.red],
            ["whole words", "millions of entries; typos and new names break it", C.red],
            ["sub-words", "~100–200K pieces cover any text", C.green],
          ].map(([a, b, col], i) => (
            <div key={i} style={{ flex: 1, ...card(col), padding: "22px 28px", ...rise(f, at(t, 3) + i * 12) }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: col }}>
                {col === C.green ? "✓ " : "✗ "}
                {a}
              </div>
              <div style={{ fontSize: 28, color: C.muted, marginTop: 8, lineHeight: 1.3 }}>{b}</div>
            </div>
          ))}
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={0} y={760} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 4)) }}>
          <Chip color={C.amber} style={{ fontSize: 36, padding: "12px 34px" }}>
            100 tokens ≈ 75 English words
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ language cost

export const A1Lang = ({ t }: CP) => {
  const f = t.frame;
  const tower = (n: number, x: number, col: string, label: string, text: string, font: string | undefined, start: number) => (
    <>
      {Array.from({ length: n }, (_, i) => {
        const p = clamp01((f - start - i * 4) / 10);
        return <Abs key={i} x={x + (i % 2) * 8} y={790 - (i + 1) * 30 - (1 - p) * 200} w={300} h={26} style={{ background: col, borderRadius: 6, opacity: p * 0.9 }} />;
      })}
      <Abs x={x - 100} y={810} w={520} style={{ textAlign: "center", opacity: enter(f, start) }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: col }}>{label}</div>
        <div style={{ fontSize: 28, color: C.muted, fontFamily: font }}>{text}</div>
      </Abs>
    </>
  );
  return (
    <>
      {tower(6, 380, C.green, "English", "How are you today?", undefined, 6)}
      {t.step >= 1 && tower(17, 900, C.pink, "Hindi", "आज आप कैसे हैं?", DEVA, at(t, 1))}
      {t.step >= 1 && (
        <Abs x={1320} y={300} w={520} style={{ ...card(C.pink), padding: "22px 28px", ...rise(f, at(t, 1) + 30) }}>
          <div style={{ fontSize: 32, fontWeight: 800 }}>same meaning, several× the tokens</div>
          <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>tokenizers learned mostly from English text</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1320} y={520} w={520} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            ["💸", "more cost: billed per token"],
            ["🐢", "slower answers"],
            ["📦", "less room in the context"],
          ].map(([i, s], k) => (
            <div key={k} style={{ ...card(), padding: "14px 22px", fontSize: 30, fontWeight: 700, ...rise(f, at(t, 2) + k * 12) }}>
              {i} {s}
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ context window

export const A1Window = ({ t }: CP) => {
  const f = t.frame;
  const X = 120;
  const Wd = 1680;
  const turns = t.step >= 2 ? Math.min(7, 1 + Math.floor(Math.max(0, since(t, 2) - 10) / 22)) : 1;
  const sys = 0.12;
  const hist = Math.min(0.78, 0.08 * turns * (t.step >= 2 ? 1.6 : 1));
  const full = sys + hist + 0.1 > 0.99;
  const seg = (x: number, w: number, col: string, label: string, o = 1) => (
    <div style={{ position: "absolute", left: x * Wd, width: Math.max(0, w * Wd - 4), top: 0, height: 110, background: `${col}55`, border: `3px solid ${col}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, opacity: o, overflow: "hidden", whiteSpace: "nowrap" }}>{w * Wd > 140 ? label : ""}</div>
  );
  return (
    <>
      <Abs x={X} y={300} w={Wd} style={{ ...rise(f, 4) }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: C.muted, marginBottom: 14 }}>one model call: everything must fit</div>
        <div style={{ position: "relative", height: 110, borderRadius: 14, border: `3px dashed ${full ? C.red : C.line}`, background: C.bg }}>
          {seg(0, sys, C.purple, "instructions")}
          {seg(sys, hist, C.blue, t.step >= 2 ? `chat history · ${turns} turns` : "your question")}
          {seg(sys + hist, 0.1, C.green, "answer")}
        </div>
      </Abs>
      {t.step === 1 && (
        <Abs x={X} y={520} w={Wd} style={{ display: "flex", gap: 30 }}>
          {[
            ["128K tokens", "≈ a 300-page book"],
            ["1M+ tokens", "the largest windows today"],
          ].map(([a, b], i) => (
            <div key={i} style={{ flex: 1, ...card(C.blue), padding: "24px 30px", ...rise(f, at(t, 1) + i * 12) }}>
              <div style={{ fontSize: 60, fontWeight: 900, color: C.blue }}>{a}</div>
              <div style={{ fontSize: 30, color: C.muted }}>{b}</div>
            </div>
          ))}
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={X} y={520} w={Wd} style={{ ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 36, fontWeight: 800 }}>
            The model remembers nothing between calls. <span style={{ color: C.amber }}>Your app resends the whole chat, every turn.</span>
          </div>
          <div style={{ fontSize: 30, color: full ? C.red : C.muted, marginTop: 18, fontWeight: 700 }}>
            {full ? "window full → drop or summarise old turns" : "each turn: slower, and more expensive"}
          </div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ embeddings

const PTS: [string, number, number, string][] = [
  ["cat", 0.12, 0.62, C.pink],
  ["dog", 0.2, 0.72, C.pink],
  ["puppy", 0.27, 0.6, C.pink],
  ["France", 0.55, 0.18, C.blue],
  ["Paris", 0.78, 0.3, C.blue],
  ["Italy", 0.5, 0.42, C.green],
  ["Rome", 0.73, 0.54, C.green],
];

export const A1Embed = ({ t }: CP) => {
  const f = t.frame;
  const M = { x: 980, y: 300, w: 820, h: 500 };
  const P = (x: number, y: number) => ({ x: M.x + x * M.w, y: M.y + y * M.h });
  const rows: [string, string][] = [
    ["cat", "0.21  -0.83  0.47  …"],
    ["dog", "0.25  -0.79  0.51  …"],
    ["Paris", "-0.62  0.34  0.90  …"],
    ["Rome", "-0.58  0.31  0.86  …"],
  ];
  return (
    <>
      {t.step <= 2 && (
        <Abs x={80} y={300} w={820} style={{ ...card(), padding: "24px 28px", opacity: t.step <= 2 ? 1 : 0, ...rise(f, 4) }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>LOOKUP TABLE · ONE ROW PER TOKEN</div>
          {rows.map(([w, v], i) => (
            <div key={w} style={{ display: "flex", gap: 24, alignItems: "center", marginTop: 16, opacity: enter(f, 10 + i * 6) }}>
              <div style={{ width: 120, fontFamily: MONO, fontSize: 32, fontWeight: 700 }}>{w}</div>
              <div style={{ fontFamily: MONO, fontSize: 28, color: C.cyan, whiteSpace: "nowrap" }}>[{v}]</div>
            </div>
          ))}
          <div style={{ fontSize: 24, color: C.faint, marginTop: 16 }}>thousands of numbers per row, learned in training</div>
        </Abs>
      )}
      {t.step >= 1 && t.step <= 2 && (
        <>
          <Svg>
            <rect x={M.x} y={M.y} width={M.w} height={M.h} rx={20} fill={C.card} stroke={C.line} strokeWidth={2} opacity={enter(f, at(t, 1))} />
            {t.step >= 2 &&
              [
                ["France", "Paris"],
                ["Italy", "Rome"],
              ].map(([a, b], i) => {
                const pa = PTS.find((p) => p[0] === a)!;
                const pb = PTS.find((p) => p[0] === b)!;
                const A = P(pa[1], pa[2]);
                const B = P(pb[1], pb[2]);
                return <Arrow key={i} x1={A.x + 20} y1={A.y + 6} x2={B.x - 24} y2={B.y - 4} color={C.amber} p={ease(f, at(t, 2) + i * 14, 24)} />;
              })}
          </Svg>
          {PTS.map(([w, x, y, col], i) => {
            const p = P(x, y);
            const o = Math.min(1, pop(f, at(t, 1) + i * 5));
            return (
              <Abs key={w} x={p.x - 70} y={p.y - 22} w={140} style={{ textAlign: "center", opacity: o }}>
                <span style={{ background: `${col}33`, border: `2px solid ${col}`, borderRadius: 10, padding: "4px 12px", fontSize: 28, fontWeight: 700 }}>{w}</span>
              </Abs>
            );
          })}
          {t.step >= 2 && (
            <Abs x={M.x} y={M.y + M.h + 20} w={M.w} style={{ textAlign: "center", fontSize: 28, color: C.amber, fontWeight: 700, ...rise(f, at(t, 2) + 20) }}>
              same direction = same relation: country → capital
            </Abs>
          )}
        </>
      )}
      {t.step === 3 && (
        <Abs x={160} y={330} w={1600} style={{ display: "flex", flexDirection: "column", gap: 40, opacity: during(t, 3) }}>
          {[
            ["dog", "bites", "man"],
            ["man", "bites", "dog"],
          ].map((ws, r) => (
            <div key={r} style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
              {ws.map((w, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <Tok s={w} size={48} color={PALETTE[["dog", "bites", "man"].indexOf(w)]} />
                  <div style={{ fontFamily: MONO, fontSize: 26, color: C.amber, marginTop: 8 }}>pos {i + 1}</div>
                </div>
              ))}
              <div style={{ fontSize: 34, color: C.muted, marginLeft: 30, marginBottom: 40 }}>{r === 0 ? "same tokens…" : "…different meaning: add position"}</div>
            </div>
          ))}
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={160} y={330} w={1600} style={{ display: "flex", flexDirection: "column", gap: 34, ...rise(f, at(t, 4)) }}>
          {[
            ["She sat on the river", "🌊"],
            ["She paid cash at the", "💰"],
          ].map(([s, icon], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 52, fontWeight: 700 }}>
              <span style={{ color: C.muted }}>{s}</span>
              <Tok s="bank" size={52} color={C.amber} />
              <span style={{ fontSize: 44 }}>{icon}</span>
            </div>
          ))}
          <div style={{ fontSize: 36, color: C.amber, fontWeight: 800 }}>one token, one starting vector, two meanings</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ attention picture

const S1: [string, number][] = [
  ["She", 0.05],
  ["sat", 0.1],
  ["on", 0.04],
  ["the", 0.06],
  ["river", 0.75],
];
const S2: [string, number][] = [
  ["She", 0.04],
  ["paid", 0.3],
  ["cash", 0.55],
  ["at", 0.05],
  ["the", 0.06],
];

const tokW = (s: string, fs: number) => s.length * fs * 0.62 + 36;

const AttnRow = ({ words, y, f, start, show, col, fs = 46 }: { words: [string, number][]; y: number; f: number; start: number; show: boolean; col: string; fs?: number }) => {
  const gap = 22;
  const all = [...words.map((w) => w[0]), "bank"];
  const ws = all.map((w) => tokW(w, fs));
  const total = ws.reduce((a, b) => a + b, 0) + gap * (all.length - 1);
  let x = 960 - total / 2;
  const xs = ws.map((w) => {
    const c = x + w / 2;
    x += w + gap;
    return c;
  });
  const bx = xs[xs.length - 1];
  return (
    <>
      <Svg>
        {show &&
          words.map(([, wt], i) => {
            const p = ease(f, start + i * 6, 22);
            const x1 = bx;
            const x2 = xs[i];
            const h = 40 + (x1 - x2) * 0.28;
            return <path key={i} d={`M ${x1} ${y - 6} Q ${(x1 + x2) / 2} ${y - 6 - h} ${x2} ${y - 6}`} stroke={col} strokeWidth={2 + wt * 22} fill="none" opacity={(0.25 + wt) * p} strokeLinecap="round" />;
          })}
      </Svg>
      {all.map((w, i) => (
        <Abs key={i} x={xs[i] - ws[i] / 2} y={y} w={ws[i]} style={{ textAlign: "center" }}>
          <div style={{ fontFamily: MONO, fontSize: fs, fontWeight: 700, padding: "4px 0", borderRadius: 12, background: i === all.length - 1 ? `${C.amber}33` : `${col}${show ? Math.round(20 + (words[i]?.[1] ?? 0) * 200).toString(16).padStart(2, "0") : "18"}`, border: `2px solid ${i === all.length - 1 ? C.amber : C.line}` }}>{w}</div>
        </Abs>
      ))}
    </>
  );
};

export const A1Attn = ({ t }: CP) => {
  const f = t.frame;
  const show = t.step >= 2;
  return (
    <>
      <AttnRow words={S1} y={360} f={f} start={at(t, 2)} show={show} col={C.cyan} />
      <AttnRow words={S2} y={660} f={f} start={at(t, 2) + 20} show={show} col={C.green} />
      {t.step === 1 && (
        <Abs x={0} y={500} w={1920} style={{ textAlign: "center", fontSize: 40, fontWeight: 800, color: C.amber, opacity: during(t, 1) }}>
          to know which bank, it must look back ↖
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={0} y={800} w={1920} style={{ display: "flex", justifyContent: "center", gap: 40, ...rise(f, at(t, 4)) }}>
          <Chip color={C.cyan} style={{ fontSize: 32 }}>bank → 🌊 water side</Chip>
          <Chip color={C.green} style={{ fontSize: 32 }}>bank → 💰 money place</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ Q, K, V

const QK: [string, number][] = [
  ["She", 0.2],
  ["paid", 2.1],
  ["cash", 2.6],
  ["at", 0.4],
  ["the", 0.1],
];

export const A1Qkv = ({ t }: CP) => {
  const f = t.frame;
  const w = softmax(
    QK.map((x) => x[1]),
    1,
  );
  return (
    <>
      <Abs x={120} y={190} w={1100} style={{ display: "flex", alignItems: "center", gap: 20, ...rise(f, 4) }}>
        <Tok s="bank" size={44} color={C.amber} />
        <div style={{ fontSize: 34, fontWeight: 700 }}>
          holds up its <span style={{ color: C.amber }}>query</span>: “what am I looking for?”
        </div>
      </Abs>
      <Abs x={120} y={300} w={1700} style={{ display: "flex", gap: 0, fontSize: 22, fontWeight: 800, color: C.faint, letterSpacing: 2, opacity: enter(f, 8) }}>
        <div style={{ width: 200 }}>TOKEN</div>
        <div style={{ width: 230 }}>KEY</div>
        <div style={{ width: 170, opacity: t.step >= 1 ? 1 : 0 }}>Q · K</div>
        <div style={{ width: 640, opacity: t.step >= 2 ? 1 : 0 }}>WEIGHT (SOFTMAX)</div>
        <div style={{ width: 300 }}>VALUE</div>
      </Abs>
      {QK.map(([s, sc], i) => {
        const y = 345 + i * 84;
        const g = ease(f, at(t, 2) + i * 4, 24);
        const hot = t.step >= 3 && w[i] > 0.2;
        return (
          <Abs key={s} x={120} y={y} w={1700} style={{ display: "flex", alignItems: "center", opacity: enter(f, 10 + i * 5) }}>
            <div style={{ width: 200 }}>
              <Tok s={s} size={32} color={C.blue} />
            </div>
            <div style={{ width: 230, fontFamily: MONO, fontSize: 28, color: C.cyan }}>k({s})</div>
            <div style={{ width: 170, fontFamily: MONO, fontSize: 32, fontWeight: 800, color: sc > 1 ? C.amber : C.muted, opacity: enter(f, at(t, 1) + i * 6) }}>{sc.toFixed(1)}</div>
            <div style={{ width: 640, display: "flex", alignItems: "center", gap: 16, opacity: t.step >= 2 ? 1 : 0 }}>
              <div style={{ width: 480 * w[i] * g + 4, height: 34, borderRadius: 8, background: C.amber }} />
              <div style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{Math.round(w[i] * 100 * g)}%</div>
            </div>
            <div style={{ width: 300 }}>
              <div style={{ display: "inline-block", fontFamily: MONO, fontSize: 26, padding: "4px 12px", borderRadius: 10, border: `2px solid ${hot ? C.green : C.line}`, background: hot ? `${C.green}33` : "transparent" }}>v({s})</div>
            </div>
          </Abs>
        );
      })}
      {t.step === 3 && (
        <Abs x={120} y={790} w={1700} style={{ textAlign: "center", opacity: during(t, 3) }}>
          <div style={{ display: "inline-block", ...card(C.green), padding: "16px 30px", fontFamily: MONO, fontSize: 32 }}>
            new bank = 0.53·v(cash) + 0.32·v(paid) + …
          </div>
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={120} y={790} w={1700} style={{ textAlign: "center", ...rise(f, at(t, 4)) }}>
          <div style={{ display: "inline-block", ...card(C.amber), padding: "16px 34px", fontFamily: MONO, fontSize: 38, fontWeight: 700 }}>
            Attention(Q, K, V) = softmax(Q·Kᵀ / √d) · V
          </div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ causal mask + heads

const MW = ["The", "cat", "sat", "on", "the", "mat"];

const Grid = ({ x, y, cell, f, start, weight, labels }: { x: number; y: number; cell: number; f: number; start: number; weight: (r: number, c: number) => number; labels: boolean }) => (
  <>
    {MW.map((_, r) =>
      MW.map((__, c) => {
        const ok = c <= r;
        const wv = ok ? weight(r, c) : 0;
        const o = enter(f, start + (r + c) * 2, 10);
        return (
          <Abs key={`${r}-${c}`} x={x + c * cell} y={y + r * cell} w={cell - 4} h={cell - 4} style={{ borderRadius: 6, background: ok ? `rgba(91,156,255,${0.15 + 0.85 * wv})` : C.bg, border: `1px solid ${C.line}`, opacity: o, display: "flex", alignItems: "center", justifyContent: "center", fontSize: cell * 0.28, color: C.faint, fontFamily: MONO }}>
            {!ok && labels ? "−∞" : ""}
          </Abs>
        );
      }),
    )}
    {labels &&
      MW.map((w, i) => (
        <Abs key={`l${i}`} x={x - 110} y={y + i * cell + cell / 2 - 18} w={100} style={{ textAlign: "right", fontFamily: MONO, fontSize: 26, color: C.muted }}>
          {w}
        </Abs>
      ))}
    {labels &&
      MW.map((w, i) => (
        <Abs key={`c${i}`} x={x + i * cell} y={y - 40} w={cell} style={{ textAlign: "center", fontFamily: MONO, fontSize: 22, color: C.muted }}>
          {w}
        </Abs>
      ))}
  </>
);

export const A1Mask = ({ t }: CP) => {
  const f = t.frame;
  const heads: [string, (r: number, c: number) => number][] = [
    ["the previous word", (r, c) => (c === r - 1 || (r === 0 && c === 0) ? 1 : 0.05)],
    ["the subject: “cat”", (r, c) => (c === 1 ? 0.9 : c === r ? 0.3 : 0.05)],
    ["itself + nearby", (r, c) => Math.max(0.05, 1 - Math.abs(r - c) * 0.4)],
  ];
  return (
    <>
      <Grid x={260} y={340} cell={84} f={f} start={6} weight={(r, c) => 0.25 + 0.6 * rnd(r * 7 + c)} labels />
      <Abs x={60} y={860} w={920} style={{ textAlign: "center", fontSize: 26, color: C.muted, fontWeight: 700, opacity: enter(f, 20) }}>
        row = the token looking · column = the token looked at
      </Abs>
      {t.step >= 2 &&
        heads.map(([name, fn], i) => (
          <div key={i}>
            <Grid x={940 + i * 320} y={400} cell={44} f={f} start={at(t, 2) + i * 14} weight={fn} labels={false} />
            <Abs x={920 + i * 320} y={680} w={300} style={{ textAlign: "center", fontSize: 26, fontWeight: 700, opacity: t.step >= 3 ? enter(f, at(t, 3) + i * 10) : 0 }}>
              head {i + 1}: {name}
            </Abs>
          </div>
        ))}
      {t.step >= 3 && (
        <Abs x={940} y={780} w={900} style={{ fontSize: 28, color: C.amber, fontWeight: 700, ...rise(f, at(t, 3) + 30) }}>
          outputs joined, then mixed back into one vector
        </Abs>
      )}
      {t.step === 1 && (
        <Abs x={940} y={420} w={880} style={{ ...card(C.purple), padding: "24px 30px", opacity: during(t, 1) }}>
          <div style={{ fontSize: 34, fontWeight: 800 }}>training: every row is a quiz</div>
          <div style={{ fontSize: 28, color: C.muted, marginTop: 10, lineHeight: 1.35 }}>“The” predicts “cat”, “The cat” predicts “sat”… one sentence, six lessons, all in one pass</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the stack

const LOGITS: [string, number][] = [
  [" Paris", 15.2],
  [" a", 12.1],
  [" the", 11.4],
  [" located", 10.9],
  [" known", 10.6],
];

export const A1Stack = ({ t }: CP) => {
  const f = t.frame;
  const n = t.step >= 1 ? 6 : 1;
  const probs = softmax(
    LOGITS.map((l) => l[1]),
    1,
  );
  const dot = t.step >= 1 ? ease(f, at(t, 1) + 10, 70) : 0;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const y = 760 - i * 88;
        const o = i === 0 ? enter(f, 4) : enter(f, at(t, 1) + i * 6, 10);
        return (
          <Abs key={i} x={180} y={y} w={560} style={{ display: "flex", gap: 8, opacity: o }}>
            <div style={{ flex: 1, ...card(C.blue), padding: "12px 0", textAlign: "center", fontSize: 26, fontWeight: 800 }}>attention</div>
            <div style={{ flex: 1, ...card(t.step === 0 ? C.green : C.purple), padding: "12px 0", textAlign: "center", fontSize: 26, fontWeight: 800 }}>feed-forward</div>
          </Abs>
        );
      })}
      {t.step === 0 && (
        <Abs x={180} y={600} w={560} style={{ fontSize: 28, color: C.green, fontWeight: 700, textAlign: "right", ...rise(f, 20) }}>
          each token alone · much of the stored knowledge ↓
        </Abs>
      )}
      {t.step >= 1 && (
        <>
          <Abs x={760} y={330} w={260} style={{ fontSize: 44, fontWeight: 900, color: C.muted, opacity: enter(f, at(t, 1) + 40) }}>
            × 32
            <div style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.3 }}>layers in Llama 3 8B</div>
          </Abs>
          <Abs x={445} y={lerp(830, 270, dot)} w={30} h={30} style={{ borderRadius: 999, background: C.amber, boxShadow: `0 0 30px ${C.amber}`, opacity: dot > 0 && dot < 1 ? 1 : 0 }} />
        </>
      )}
      {t.step >= 2 && (
        <Abs x={1040} y={300} w={760} style={{ ...card(), padding: "22px 30px", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>
            {t.step >= 3 ? "SOFTMAX → PROBABILITIES" : "LOGITS: ONE RAW SCORE PER VOCABULARY TOKEN"}
          </div>
          {LOGITS.map(([s, l], i) => {
            const k = t.step >= 3 ? ease(f, at(t, 3), 30) : 0;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 14 }}>
                <div style={{ width: 180, fontFamily: MONO, fontSize: 32, fontWeight: 700 }}>{s.trim()}</div>
                <div style={{ height: 30, borderRadius: 8, width: lerp((l - 8) * 40, probs[i] * 420 + 4, k), background: k > 0.5 ? C.green : C.purple }} />
                <div style={{ fontFamily: MONO, fontSize: 28, color: C.muted }}>{k > 0.5 ? `${Math.round(probs[i] * 100)}%` : l.toFixed(1)}</div>
              </div>
            );
          })}
          <div style={{ fontSize: 24, color: C.faint, marginTop: 14 }}>…and ~100,000 more</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ prefill and decode

const PROMPT = ["You", " are", " a", " helpful", " assistant", ".", " What", " is", " the", " capital", " of", " France", "?"];
const OUT = [" The", " capital", " is", " Paris", "."];

export const A1Prefill = ({ t }: CP) => {
  const f = t.frame;
  const lit = t.step >= 1 ? enter(f, at(t, 1) + 10, 10) : 0;
  const outN = t.step >= 2 ? Math.min(OUT.length, Math.floor(Math.max(0, since(t, 2) - 10) / 22) + 1) : 0;
  const cached = t.step >= 4;
  return (
    <>
      <Abs x={80} y={190} w={1220} style={{ fontSize: 28, fontWeight: 800, color: C.muted, letterSpacing: 2, ...rise(f, 2) }}>
        PROMPT · {PROMPT.length} TOKENS
      </Abs>
      <Abs x={80} y={250} w={1760} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {PROMPT.map((s, i) => (
          <Tok key={i} s={s} size={32} color={cached && i < 6 ? C.green : C.blue} style={{ boxShadow: lit > 0 && t.step === 1 ? `0 0 ${24 * lit}px ${C.blue}` : undefined, opacity: enter(f, 4 + i * 2) }} />
        ))}
        {OUT.slice(0, outN).map((s, i) => (
          <Tok key={`o${i}`} s={s} size={32} color={C.amber} style={{ transform: `scale(${Math.min(1, pop(f, at(t, 2) + 10 + i * 22))})` }} />
        ))}
      </Abs>
      {cached && (
        <Abs x={80} y={760} w={1760} style={{ ...rise(f, at(t, 4)) }}>
          <Chip color={C.green} style={{ fontSize: 30 }}>
            green prefix: identical in every request, computed once, cached and reused
          </Chip>
        </Abs>
      )}
      {t.step >= 1 && (
        <Abs x={80} y={420} w={820} style={{ ...card(C.blue), padding: "22px 30px", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: C.blue }}>1 · Prefill</div>
          <div style={{ fontSize: 28, color: C.muted, marginTop: 8, lineHeight: 1.35 }}>all prompt tokens, every layer, in parallel → time to first token</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={960} y={420} w={880} style={{ ...card(C.amber), padding: "22px 30px", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: C.amber }}>2 · Decode</div>
          <div style={{ fontSize: 28, color: C.muted, marginTop: 8, lineHeight: 1.35 }}>one token per step, reusing stored keys and values</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 16 }}>
            {Array.from({ length: PROMPT.length + outN }, (_, i) => (
              <div key={i} style={{ width: 30, height: 30, borderRadius: 6, background: i < PROMPT.length ? `${C.blue}99` : C.amber }} />
            ))}
          </div>
          <div style={{ fontSize: 24, color: C.faint, marginTop: 10 }}>KV cache in GPU memory: grows by one entry per token</div>
        </Abs>
      )}
      {t.step === 3 && (
        <Abs x={80} y={760} w={1760} style={{ display: "flex", gap: 30, opacity: during(t, 3) }}>
          <Chip color={C.red} style={{ fontSize: 30 }}>2× prompt → up to ~4× attention work</Chip>
          <Chip color={C.purple} style={{ fontSize: 30 }}>longer context → bigger KV cache → fewer users per GPU</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ sampling

const COLS: [string, number, string][] = [
  ["blue", 3.2, "#5b9cff"],
  ["green", 2.4, "#38d996"],
  ["red", 2.1, "#ff6262"],
  ["purple", 1.6, "#a78bfa"],
  ["black", 1.2, "#93a0b8"],
  ["yellow", 0.9, "#ffd447"],
  ["orange", 0.7, "#ff8a5b"],
  ["pink", 0.4, "#ff6fa5"],
];

export const A1Sample = ({ t }: CP) => {
  const f = t.frame;
  let T = 1;
  if (t.step === 2) T = lerp(1, 0.3, ease(f, at(t, 2) + 20, 40));
  if (t.step === 3) T = lerp(0.3, 1.6, ease(f, at(t, 3) + 10, 40));
  if (t.step >= 4) T = lerp(1.6, 1, ease(f, at(t, 4), 20));
  const p = softmax(
    COLS.map((c) => c[1]),
    T,
  );
  const topP = t.step >= 4;
  let cum = 0;
  const kept = p.map((x) => {
    const k = cum < 0.9;
    cum += x;
    return k;
  });
  // the spin at step 1: a marker falls through the bars and lands on "green"
  const spin = t.step === 1 ? ease(f, at(t, 1) + 30, 50) : 0;
  const landed = t.step === 1 && spin >= 1;
  return (
    <>
      <Abs x={80} y={170} w={1220} style={{ fontSize: 44, fontWeight: 800, ...rise(f, 2) }}>
        “My favourite colour is <span style={{ color: C.amber }}>___</span>”
      </Abs>
      {COLS.map(([name, , col], i) => {
        const y = 280 + i * 70;
        const greedy = t.step === 0 && i === 0;
        const out = topP && !kept[i];
        return (
          <Abs key={name} x={80} y={y} w={1220} style={{ display: "flex", alignItems: "center", gap: 20, opacity: enter(f, 6 + i * 3) * (out ? 0.25 : 1) }}>
            <div style={{ width: 160, textAlign: "right", fontFamily: MONO, fontSize: 32, fontWeight: 700, color: greedy || (landed && i === 1) ? C.amber : C.text }}>{name}</div>
            <div style={{ width: Math.max(6, 820 * p[i]), height: 44, borderRadius: 10, background: col, outline: greedy || (landed && i === 1) ? `4px solid ${C.amber}` : undefined }} />
            <div style={{ fontSize: 28, fontWeight: 800, color: C.muted, fontVariantNumeric: "tabular-nums" }}>{(p[i] * 100).toFixed(0)}%</div>
          </Abs>
        );
      })}
      {t.step === 1 && (
        <Abs x={30} y={lerp(280, 280 + 70, spin) + Math.sin(f / 3) * (1 - spin) * 140 + 6} w={40} h={40} style={{ borderRadius: 999, background: C.amber, boxShadow: `0 0 24px ${C.amber}`, opacity: spin > 0 ? 1 : 0 }} />
      )}
      {topP && (
        <Abs x={60} y={280 + kept.filter(Boolean).length * 70 - 10} w={1240} h={4} style={{ background: C.red, opacity: enter(f, at(t, 4) + 20) }}>
          <div style={{ position: "absolute", right: 0, top: -40, fontSize: 26, fontWeight: 800, color: C.red }}>top-p 0.9: cut here</div>
        </Abs>
      )}
      <Abs x={1360} y={300} w={460} style={{ ...card(C.amber), padding: "26px 30px", textAlign: "center", ...rise(f, 6) }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>TEMPERATURE</div>
        <div style={{ fontSize: 90, fontWeight: 900, color: C.amber, fontVariantNumeric: "tabular-nums" }}>{t.step === 0 ? "0" : T.toFixed(2)}</div>
        <div style={{ fontSize: 26, color: C.muted }}>{t.step === 0 ? "greedy: always the top token" : "probabilities = softmax(logits / T)"}</div>
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ hallucination

export const A1Halluc = ({ t }: CP) => {
  const f = t.frame;
  const cite = "Varghese v. China Southern Airlines, 925 F.3d 1339 (11th Cir. 2019)";
  const typed = cite.slice(0, Math.max(0, Math.floor((f - 40) * 1.4)));
  const s1 = 40 + cite.length / 1.4 + 20;
  const up = ease(f, at(t, 2), 30);
  return (
    <>
      <Abs x={140} y={lerp(170, 140, up)} w={1160} style={{ ...card(), background: C.bg2, padding: "28px 36px", display: "flex", flexDirection: "column", gap: 20, transform: `scale(${1 - up * 0.12})`, transformOrigin: "50% 0%", opacity: enter(f, 2) }}>
        <div style={{ alignSelf: "flex-end", maxWidth: 900, background: C.blue, color: "#06101f", borderRadius: 24, borderBottomRightRadius: 6, padding: "16px 26px", fontSize: 32, fontWeight: 600 }}>Find a case where an airline was held liable for a passenger's injury. Cite it.</div>
        <div style={{ alignSelf: "flex-start", maxWidth: 1080, background: C.card2, borderRadius: 24, borderBottomLeftRadius: 6, padding: "16px 26px", fontSize: 30, fontFamily: MONO, color: f > s1 ? C.red : C.text }}>
          {typed}
          {typed.length < cite.length && <span style={{ color: C.blue }}>▌</span>}
        </div>
      </Abs>
      {f > s1 && t.step < 2 && (
        <Abs x={0} y={560} w={1920} style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ border: `8px solid ${C.red}`, color: C.red, fontSize: 70, fontWeight: 900, letterSpacing: 4, padding: "6px 36px", borderRadius: 16, background: "rgba(12,16,24,0.88)", transform: `rotate(-6deg) scale(${2 - Math.min(1, pop(f, s1))})`, opacity: enter(f, s1, 5) }}>
            THIS CASE DOES NOT EXIST
          </div>
        </Abs>
      )}
      {f > s1 && t.step < 2 && (
        <Abs x={0} y={760} w={1920} style={{ textAlign: "center", fontSize: 30, color: C.muted, opacity: enter(f, s1 + 20) }}>
          New York, 2023: lawyers filed a brief with cases a chatbot made up, and were sanctioned
        </Abs>
      )}
      {t.step === 2 && (
        <Abs x={260} y={520} w={1400} style={{ ...card(C.amber), padding: "26px 34px", opacity: during(t, 2) }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>WHAT IT LEARNED: THE SHAPE OF A CITATION</div>
          <div style={{ fontFamily: MONO, fontSize: 38, marginTop: 14 }}>
            <span style={{ color: C.blue }}>Name</span> v. <span style={{ color: C.blue }}>Name</span>, <span style={{ color: C.green }}>###</span> F.3d <span style={{ color: C.green }}>####</span> (<span style={{ color: C.purple }}>Cir.</span> <span style={{ color: C.amber }}>Year</span>)
          </div>
          <div style={{ fontSize: 30, marginTop: 14, fontWeight: 700 }}>
            likely shape <span style={{ color: C.green }}>✓</span> · real case behind it <span style={{ color: C.red }}>✗</span>
          </div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={260} y={520} w={1400} style={{ display: "flex", gap: 30 }}>
          {[
            ["confident guess", "sometimes right → points", C.green, "+1"],
            ["“I don't know”", "never scores", C.muted, "0"],
          ].map(([a, b, col, pts], i) => (
            <div key={i} style={{ flex: 1, ...card(col), padding: "24px 30px", ...rise(f, at(t, 3) + i * 12) }}>
              <div style={{ fontSize: 34, fontWeight: 800 }}>{a}</div>
              <div style={{ fontSize: 28, color: C.muted, marginTop: 6 }}>{b}</div>
              <div style={{ fontSize: 70, fontWeight: 900, color: col }}>{pts}</div>
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ prompt building

const BLOCKS: [string, string, string][] = [
  ["Role & goal (system prompt)", "You route support emails for a software company to the right team.", C.blue],
  ["Rules for the unclear cases", "Refund or invoice → billing, even if a bug is mentioned.", C.green],
  ["Examples of the hard cases", "“App crashed and I was charged twice” → billing", C.purple],
  ["Input, fenced off", "<email>{email}</email>", C.cyan],
  ["Exact output format", '{"team": "billing" | "bug" | "account" | "other"}', C.amber],
];

export const A1Prompt = ({ t }: CP) => {
  const f = t.frame;
  const v1 = t.step < 2;
  const score = t.step >= 7 ? lerp(78, 93, ease(f, at(t, 7), 40)) : 78;
  return (
    <>
      {v1 && (
        <Abs x={80} y={260} w={1120} style={{ ...card(), padding: "26px 30px", opacity: 1 - enter(f, at(t, 2) - 6, 6), ...rise(f, 4) }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>ATTEMPT 1</div>
          <div style={{ fontFamily: MONO, fontSize: 30, marginTop: 10 }}>Classify this email as billing, bug, account or other.</div>
        </Abs>
      )}
      {t.step === 1 &&
        ["IMPORTANT!!! refunds are NOT bugs", "NEVER answer other!!", "login = account (unless billing??)"].map((s, i) => (
          <Abs key={i} x={140 + i * 340} y={460 + (i % 2) * 120} w={340} style={{ background: "#ffe27a", color: "#2a2200", padding: "18px 20px", fontSize: 26, fontWeight: 800, borderRadius: 6, transform: `rotate(${[-4, 3, -2][i]}deg) scale(${Math.min(1, pop(f, at(t, 1) + 10 + i * 14))})`, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
            {s}
          </Abs>
        ))}
      {!v1 &&
        BLOCKS.map(([label, text, col], i) => {
          const st = i + 2;
          if (t.step < st) return null;
          return (
            <Abs key={i} x={80} y={230 + i * 128} w={1120} style={{ ...card(t.step === st ? col : C.line), padding: "14px 24px", ...rise(f, at(t, st), 20) }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: col, letterSpacing: 1 }}>{label.toUpperCase()}</div>
              <div style={{ fontFamily: MONO, fontSize: 26, marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{text}</div>
            </Abs>
          );
        })}
      <Abs x={1300} y={300} w={540} style={{ ...card(t.step >= 7 ? C.green : C.line), padding: "28px 30px", textAlign: "center", ...rise(f, 8) }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>CORRECT ON 300 LABELLED EMAILS</div>
        <div style={{ fontSize: 120, fontWeight: 900, color: t.step >= 7 ? C.green : C.amber, fontVariantNumeric: "tabular-nums" }}>{Math.round(score)}%</div>
        <div style={{ fontSize: 26, color: C.muted }}>{t.step >= 7 ? "same model, better brief" : "one-line prompt"}</div>
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ chain of thought + vote

export const A1Vote = ({ t }: CP) => {
  const f = t.frame;
  const paths: [string[], string, boolean][] = [
    [["bat = ball + 1.00", "2·ball + 1.00 = 1.10", "ball = 0.05"], "$0.05", true],
    [["ball = x, bat = x + 1", "2x = 0.10", "x = 0.05"], "$0.05", true],
    [["1.10 − 1.00 = 0.10"], "$0.10", false],
  ];
  const shown = t.step >= 1 ? 3 : 1;
  return (
    <>
      <Abs x={80} y={300} w={500} style={{ ...card(), padding: "26px 30px", ...rise(f, 4) }}>
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.35 }}>A bat and a ball cost $1.10. The bat costs $1 more than the ball.</div>
        <div style={{ fontSize: 34, fontWeight: 800, color: C.amber, marginTop: 14 }}>How much is the ball?</div>
      </Abs>
      {paths.slice(0, shown).map(([steps, ans, ok], i) => {
        const st = i === 0 ? 10 : at(t, 1) + (i - 1) * 16;
        return (
          <Abs key={i} x={640} y={290 + i * 160} w={1220} style={{ display: "flex", alignItems: "center", gap: 14, ...rise(f, st) }}>
            {steps.map((s, j) => (
              <div key={j} style={{ ...card(C.line), padding: "10px 16px", fontFamily: MONO, fontSize: 24, whiteSpace: "nowrap", opacity: enter(f, st + 10 + j * 14) }}>
                {s}
              </div>
            ))}
            <div style={{ fontSize: 40, fontWeight: 900, whiteSpace: "nowrap", color: ok ? C.green : C.red, opacity: enter(f, st + 10 + steps.length * 14) }}>→ {ans}</div>
          </Abs>
        );
      })}
      {t.step >= 1 && (
        <Abs x={660} y={790} w={1100} style={{ ...rise(f, at(t, 1) + 60) }}>
          <Chip color={C.green} style={{ fontSize: 34, padding: "12px 30px" }}>
            majority vote: $0.05 ✓ · at 3× the cost
          </Chip>
        </Abs>
      )}
    </>
  );
};
