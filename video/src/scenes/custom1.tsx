import type { Clock } from "../lib/timeline.ts";
import { C, DEVA, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise, softmax } from "../lib/anim.ts";
import { Abs, card, Chip, SceneTitle } from "./ui.tsx";

type CP = { t: Clock; props?: Record<string, unknown> };
const at = (t: Clock, i: number) => (i <= 0 ? 4 : (t.beats[i]?.stepStart ?? Infinity));

// ------------------------------------------------------------------ phone keyboard

export const Phone = ({ t }: CP) => {
  const f = t.frame;
  const typed = "see you".slice(0, Math.max(0, Math.floor((f - 14) / 4)));
  const sug = enter(f, 50, 12);
  const keys = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  return (
    <>
      <Abs x={200} y={150} w={470} h={720} style={{ ...card(), borderRadius: 54, background: "#05070c", padding: 22, ...rise(f, 2) }}>
        <div style={{ background: C.bg2, borderRadius: 36, height: "100%", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: 22, top: 70, background: C.blue, color: "#06101f", borderRadius: 22, padding: "12px 20px", fontSize: 26, fontWeight: 600 }}>
            Running late, will call
          </div>
          <div style={{ position: "absolute", left: 18, right: 18, top: 330, background: C.card2, borderRadius: 18, padding: "14px 18px", fontSize: 30 }}>
            {typed}
            <span style={{ opacity: Math.floor(f / 15) % 2 ? 1 : 0, color: C.blue }}>|</span>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 410, display: "flex", justifyContent: "space-around", fontSize: 28, opacity: sug }}>
            <span style={{ color: C.muted }}>soon</span>
            <span style={{ color: C.green, fontWeight: 800, transform: `scale(${1 + 0.12 * Math.sin(Math.min(1, (f - 50) / 20) * Math.PI)})` }}>tomorrow</span>
            <span style={{ color: C.muted }}>later</span>
          </div>
          {keys.map((row, r) => (
            <div key={r} style={{ position: "absolute", top: 480 + r * 62, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
              {row.split("").map((k) => (
                <div key={k} style={{ width: 34, height: 52, borderRadius: 8, background: C.card2, color: C.muted, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {k}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Abs>
      <Abs x={800} y={200} w={1040} style={rise(f, 60)}>
        <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.3 }}>
          Next-word suggestions,
          <br />
          learned from millions of messages.
        </div>
      </Abs>
      <Abs x={800} y={420} w={1040} style={rise(f, at(t, 1))}>
        <div style={{ ...card(C.blue), padding: 40 }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.blue, letterSpacing: 2 }}>LARGE LANGUAGE MODEL</div>
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 30, fontSize: 32, fontWeight: 700 }}>
            <div style={{ ...card(), padding: "18px 24px" }}>text so far</div>
            <div style={{ color: C.muted }}>→</div>
            <div style={{ ...card(C.purple), padding: "18px 24px", background: `${C.purple}22` }}>LLM</div>
            <div style={{ color: C.muted }}>→</div>
            <div style={{ ...card(C.green), padding: "18px 24px" }}>likely next text</div>
          </div>
          <div style={{ fontSize: 34, color: C.muted, marginTop: 30 }}>Same idea, taken to an extreme. That is the whole job.</div>
        </div>
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ fill in the blank

export const Fill = ({ t, props }: CP) => {
  const f = t.frame;
  const items = (props?.items ?? []) as { before: string; answer: string; note: string }[];
  const absorbed = ["grammar", "facts about the world", "writing styles", "step-by-step reasoning"];
  return (
    <>
      <SceneTitle text="To predict the next word well, it had to absorb…" frame={f} />
      <Abs x={80} y={230} w={1760} style={{ display: "flex", gap: 22 }}>
        {absorbed.map((a, i) => {
          const p = pop(f, 30 + i * 22);
          return (
            <div key={a} style={{ transform: `scale(${Math.min(1, p)})`, opacity: Math.min(1, p) }}>
              <Chip color={PALETTE[i]} style={{ fontSize: 32, padding: "12px 26px" }}>
                {a}
              </Chip>
            </div>
          );
        })}
      </Abs>
      {items.map((it, i) => {
        const st = at(t, i + 1);
        const fill = it.answer.slice(0, Math.max(0, Math.floor((f - st - 24) / 2.5)));
        return (
          <Abs key={i} x={80} y={380 + i * 190} w={1760} style={rise(f, st)}>
            <div style={{ ...card(), padding: "28px 36px", display: "flex", alignItems: "center", gap: 24, fontSize: 40, fontWeight: 600 }}>
              <span>{it.before}</span>
              <span style={{ minWidth: 220, borderBottom: `4px solid ${C.green}`, color: C.green, fontWeight: 800, paddingBottom: 2 }}>{fill || " "}</span>
              <span style={{ marginLeft: "auto", opacity: enter(f, st + 40) }}>
                <Chip color={C.amber}>{it.note}</Chip>
              </span>
            </div>
          </Abs>
        );
      })}
      <Abs x={80} y={800} w={1760} style={{ textAlign: "center", ...rise(f, at(t, 3)) }}>
        <div style={{ fontSize: 38, fontWeight: 700 }}>
          “Guess the next word” <span style={{ color: C.muted }}>→</span> <span style={{ color: C.green }}>answers questions · writes code · summarises documents</span>
        </div>
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ tokens

const chipW = (s: string, size = 40) => Math.max(56, s.length * size * 0.6 + 34);

const TokenRow = ({ toks, x, y, frame, split, color = true, ids, idFrame, size = 40, font }: { toks: string[]; x: number; y: number; frame: number; split: number; color?: boolean; ids?: number[]; idFrame?: number; size?: number; font?: string }) => {
  let cx = x;
  const gap = lerp(0, 18, split);
  return (
    <>
      {toks.map((tk, i) => {
        const w = chipW(tk.trimStart(), size) + (tk.startsWith(" ") ? size * 0.35 : 0);
        const left = cx;
        cx += w + gap;
        const col = PALETTE[i % PALETTE.length];
        const bg = color ? `rgba(${hex(col)},${0.18 * split})` : "transparent";
        return (
          <div key={i} style={{ position: "absolute", left, top: y }}>
            <div
              style={{
                width: w,
                height: size * 1.9,
                borderRadius: lerp(4, 14, split),
                border: `3px solid ${split > 0.05 ? col : "transparent"}`,
                background: split > 0.05 ? bg : C.card,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: size,
                fontWeight: 600,
                fontFamily: font ?? MONO,
                whiteSpace: "pre",
              }}
            >
              {tk.startsWith(" ") && <span style={{ color: C.faint, fontSize: size * 0.6 }}>·</span>}
              {tk.trimStart()}
            </div>
            {ids && idFrame !== undefined && frame >= idFrame && (
              <div style={{ textAlign: "center", marginTop: 12, fontFamily: MONO, fontSize: 28, color: C.muted, opacity: enter(frame, idFrame + i * 4) }}>
                {Math.round(ids[i] * enter(frame, idFrame + i * 4, 22))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

const hex = (h: string) => `${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)}`;
const rowWidth = (toks: string[], size = 40, gap = 18) => toks.reduce((a, tk) => a + chipW(tk.trimStart(), size) + (tk.startsWith(" ") ? size * 0.35 : 0) + gap, -gap);

export const Tokens = ({ t }: CP) => {
  const f = t.frame;
  const toks = ["Ref", "und", " for", " spoiled", " milk", "?"];
  const ids = [6943, 917, 329, 34781, 7545, 30];
  const split = ease(f, at(t, 1), 24);
  const x0 = (1920 - rowWidth(toks)) / 2;
  const code = ["ERR", "_", "SL", "OT", "_", "EXP", "IRED"];
  const x1 = (1920 - rowWidth(code, 36)) / 2;
  const ruleUp = t.step >= 3;
  return (
    <>
      <SceneTitle text={t.step === 0 ? "Text, as the model sees it" : "The tokeniser: text → bricks → ids"} frame={f} />
      <Abs x={0} y={230} w={1920} style={{ textAlign: "center", fontSize: 30, color: C.muted, opacity: 1 - split }}>
        one string of characters
      </Abs>
      <Abs x={0} y={0} w={1920} style={{ transform: `translateY(${ruleUp ? -lerp(0, 60, ease(f, at(t, 4), 20)) : 0}px)` }}>
        <TokenRow toks={toks} x={x0} y={300} frame={f} split={split} ids={ids} idFrame={t.step >= 2 ? at(t, 2) : undefined} />
      </Abs>
      {t.step === 3 && (
        <>
          <Abs x={x0} y={480} w={chipW("Ref") + chipW("und") + 18} style={{ ...rise(f, at(t, 3)), borderTop: `4px solid ${C.pink}`, textAlign: "center", paddingTop: 12, fontSize: 28, color: C.pink, fontWeight: 700 }}>
            rarer word → 2 bricks
          </Abs>
          <Abs x={x0 + rowWidth(toks.slice(0, 4)) + 18} y={480} w={chipW("milk") + 14} style={{ ...rise(f, at(t, 3) + 10), borderTop: `4px solid ${C.green}`, textAlign: "center", paddingTop: 12, fontSize: 28, color: C.green, fontWeight: 700, whiteSpace: "nowrap" }}>
            common → 1
          </Abs>
        </>
      )}
      {t.step >= 4 && (
        <>
          <Abs x={0} y={520} w={1920} style={{ textAlign: "center", fontFamily: MONO, fontSize: 40, ...rise(f, at(t, 4)) }}>
            ERR_SLOT_EXPIRED
          </Abs>
          <Abs x={0} y={0} w={1920} style={{ opacity: enter(f, at(t, 4) + 20) }}>
            <TokenRow toks={code} x={x1} y={610} frame={f} split={ease(f, at(t, 4) + 20, 20)} size={36} />
          </Abs>
          <Abs x={0} y={710} w={1920} style={{ textAlign: "center", fontSize: 28, color: C.muted, opacity: enter(f, at(t, 4) + 40) }}>
            codes, long numbers, many non-English scripts → many small bricks
          </Abs>
        </>
      )}
      {t.step >= 5 && (
        <Abs x={610} y={790} w={700} style={{ ...card(C.amber), padding: "18px 0", textAlign: "center", fontSize: 44, fontWeight: 800, transform: `scale(${Math.min(1, pop(f, at(t, 5)))})` }}>
          100 tokens ≈ 75 English words
        </Abs>
      )}
      <Abs x={1400} y={880} w={440} style={{ textAlign: "right", fontSize: 20, color: C.faint, opacity: split }}>
        illustrative split · every tokeniser differs
      </Abs>
    </>
  );
};

export const Marathi = ({ t }: CP) => {
  const f = t.frame;
  const en = ["Can", " I", " get", " a", " refund", " for", " spoiled", " milk", "?"];
  const mr = ["ख", "रा", "ब", " दु", "धा", "सा", "ठी", " प", "रता", "वा", " मि", "ळे", "ल", " का", "?"];
  const size = 30;
  const bar = (n: number, col: string, y: number, label: string, st: number) => {
    const p = ease(f, st, 30);
    return (
      <Abs x={330} y={y} w={1500} style={{ display: "flex", alignItems: "center", gap: 24, opacity: enter(f, st) }}>
        <div style={{ width: 170, fontSize: 30, fontWeight: 700 }}>{label}</div>
        <div style={{ height: 50, width: n * 62 * p, background: col, borderRadius: 10 }} />
        <div style={{ fontSize: 30, fontWeight: 800, color: col }}>{Math.round(n * p)} tokens</div>
      </Abs>
    );
  };
  return (
    <>
      <SceneTitle text="Same question, different number of bricks" frame={f} />
      <Abs x={80} y={235} w={1760} style={{ fontSize: 34, fontWeight: 700, ...rise(f, 6) }}>
        English <span style={{ color: C.muted, fontWeight: 500 }}>· Can I get a refund for spoiled milk?</span>
      </Abs>
      <TokenRow toks={en} x={80} y={300} frame={f} split={ease(f, 20, 20)} size={size} />
      <Abs x={1560} y={300} w={280} style={{ textAlign: "right", opacity: enter(f, 40) }}>
        <Chip color={C.green}>9 tokens</Chip>
      </Abs>
      {t.step >= 1 && (
        <>
          <Abs x={80} y={430} w={1760} style={{ fontSize: 34, fontWeight: 700, ...rise(f, at(t, 1)) }}>
            Marathi <span style={{ color: C.muted, fontWeight: 500, fontFamily: DEVA }}>· खराब दुधासाठी परतावा मिळेल का?</span>
          </Abs>
          <Abs x={0} y={0} w={1920} style={{ opacity: enter(f, at(t, 1) + 10) }}>
            <TokenRow toks={mr} x={80} y={500} frame={f} split={ease(f, at(t, 1) + 16, 20)} size={size} font={DEVA} />
          </Abs>
          <Abs x={1560} y={500} w={280} style={{ textAlign: "right", opacity: enter(f, at(t, 1) + 40) }}>
            <Chip color={C.pink}>15 tokens</Chip>
          </Abs>
        </>
      )}
      {t.step >= 2 && (
        <>
          <Abs x={80} y={640} w={600} style={{ fontSize: 30, color: C.muted, fontWeight: 700, opacity: enter(f, at(t, 2)) }}>
            You pay per token:
          </Abs>
          {bar(9, C.green, 700, "English", at(t, 2))}
          {bar(15, C.pink, 770, "Marathi", at(t, 2) + 12)}
          <Abs x={500} y={850} w={1000} style={{ ...rise(f, at(t, 2) + 40), fontSize: 36, fontWeight: 800, color: C.amber }}>
            ≈ 1.7× the price for the same question
          </Abs>
        </>
      )}
      <Abs x={1400} y={880} w={440} style={{ textAlign: "right", fontSize: 20, color: C.faint }}>
        illustrative counts
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ sampling: the weighted die

const BASIC = { context: "Bakery items can be refunded", tokens: ["within", "only", "up", "after", "if", "for"], probs: [0.62, 0.21, 0.09, 0.04, 0.02, 0.02] };
const EXAMPLE = { context: "Bakery items can be refunded", tokens: ["within", "only", "up"], logits: [2.0, 0.9, 0.1] };

export const Sampling = ({ t, props }: CP) => {
  const f = t.frame;
  const mode = (props?.mode as string) ?? "basic";
  const ex = mode === "example";
  const tokens = ex ? EXAMPLE.tokens : BASIC.tokens;
  const logits = ex ? EXAMPLE.logits : BASIC.probs.map((p) => Math.log(p) + 4.6);

  // Temperature over time.
  const plan: number[] = mode === "temp" ? [1, 0.45, 1.8, 0, 1, 1, 1] : ex ? [0, 1, 1] : [1, 1, 1, 1, 1];
  const s = Math.min(t.step, plan.length - 1);
  let T = s === 0 ? plan[0] : lerp(plan[s - 1], plan[s], ease(f, at(t, s), 26));
  if (ex && s === 1) T = lerp(lerp(0, 1, ease(f, at(t, 1), 20)), 2, ease(f, at(t, 1) + t.len(1) * 0.42, 26));
  if (ex && s === 2) T = lerp(2, 1, ease(f, at(t, 2), 20));
  const probs = softmax(logits, Math.max(T, 0.03));

  const showLogits = mode === "basic" && t.step === 0;
  const toProb = mode === "basic" ? ease(f, at(t, 1), 26) : 1;
  const topP = (mode === "temp" && t.step >= 5 ? 0.9 : 0) || (ex && t.step >= 2 ? 0.85 : 0);
  let cum = 0;
  const kept = probs.map((p) => {
    const keep = !topP || cum < topP;
    cum += p;
    return keep;
  });
  const cumul = probs.map((_, i) => probs.slice(0, i + 1).reduce((a, b) => a + b, 0));

  // The roll (basic mode, step 2): a highlight that slows down and lands on "within".
  const rollStart = at(t, 2);
  const seq = [1, 0, 2, 0, 3, 1, 0, 4, 2, 0, 1, 0];
  const rf = f - rollStart;
  let rolling = -1;
  if (mode === "basic" && t.step === 2 && rf >= 0) {
    let acc = 0;
    rolling = 0;
    for (let i = 0; i < seq.length; i++) {
      acc += 2 + i;
      if (rf < acc) {
        rolling = seq[i];
        break;
      }
      rolling = 0;
    }
  }
  const landed = mode === "basic" && t.step >= 2 && rf > 90;
  const extra = [" 6", " hours", " of", " delivery."];
  const nExtra = mode === "basic" && t.step >= 3 ? Math.min(extra.length, Math.floor((f - at(t, 3)) / 14)) : 0;
  const branch = mode === "basic" && t.step >= 4 ? ease(f, at(t, 4), 24) : 0;

  const rowH = ex ? 120 : 92;
  const maxW = 760;
  const heading = showLogits
    ? "logits: a raw score for every token"
    : mode === "basic"
      ? "softmax → probabilities that add up to 1"
      : mode === "temp" && t.step >= 4
        ? "top-p: cut the long tail before rolling"
        : "temperature reshapes the die";

  return (
    <>
      <Abs x={80} y={128} w={1760} style={{ ...card(), padding: "22px 30px", fontSize: 40, fontWeight: 600, ...rise(f, 2) }}>
        {BASIC.context}
        {landed && <span style={{ color: C.blue, fontWeight: 800 }}> within</span>}
        {extra.slice(0, nExtra).map((x, i) => (
          <span key={i} style={{ color: PALETTE[(i + 1) % PALETTE.length], fontWeight: 700, opacity: enter(f, at(t, 3) + (i + 1) * 14 - 4, 6) }}>
            {x}
          </span>
        ))}
        <span style={{ opacity: Math.floor(f / 15) % 2 ? 1 : 0, color: C.blue }}> ▌</span>
      </Abs>

      <Abs x={80} y={262} w={1100} style={{ fontSize: 30, fontWeight: 700, color: C.amber, opacity: 1 - branch }}>
        {heading}
      </Abs>

      <div style={{ opacity: 1 - branch }}>
        {tokens.map((tk, i) => {
          const w = showLogits ? (logits[i] / 5) * maxW : lerp((logits[i] / 5) * maxW, probs[i] * maxW, toProb);
          const label = showLogits ? logits[i].toFixed(2) : ex ? probs[i].toFixed(2) : `${Math.round(probs[i] * 100)}%`;
          const hot = rolling === i || (landed && i === 0 && t.step === 2);
          const dropped = !kept[i];
          const y = 320 + i * rowH;
          return (
            <Abs key={tk} x={80} y={y} w={1150} h={rowH - 16} style={{ display: "flex", alignItems: "center", gap: 22, opacity: (dropped ? 0.25 : 1) * enter(f, 6 + i * 4) }}>
              <div style={{ width: 170, textAlign: "right", fontFamily: MONO, fontSize: ex ? 40 : 34, fontWeight: 600, color: hot ? C.blue : C.text, textDecoration: dropped ? "line-through" : "none" }}>{tk}</div>
              {ex && <div style={{ width: 120, fontSize: 24, color: C.faint, fontFamily: MONO }}>score {logits[i].toFixed(1)}</div>}
              <div style={{ height: rowH - 34, width: Math.max(4, w), background: hot ? C.blue : PALETTE[i % PALETTE.length], borderRadius: 10, boxShadow: hot ? `0 0 30px ${C.blue}` : "none" }} />
              <div style={{ fontSize: 32, fontWeight: 800, fontFamily: MONO }}>{label}</div>
              {topP > 0 && <div style={{ fontSize: 24, color: dropped ? C.faint : C.green, fontFamily: MONO, marginLeft: 6 }}>Σ {cumul[i].toFixed(2)}</div>}
            </Abs>
          );
        })}
        {topP > 0 && (
          <Abs x={80} y={320 + kept.filter(Boolean).length * rowH - 12} w={1120} style={{ borderTop: `4px dashed ${C.green}`, opacity: enter(f, at(t, mode === "temp" ? 5 : 2) + 10) }}>
            <div style={{ position: "absolute", right: 0, top: 6, fontSize: 24, color: C.green, fontWeight: 700 }}>top-p {topP} cut-off</div>
          </Abs>
        )}
        {mode === "temp" && t.step === 4 && (
          <Abs x={60} y={320 + 3 * rowH - 10} w={1150} h={3 * rowH} style={{ border: `3px dashed ${C.pink}`, borderRadius: 16, opacity: enter(f, at(t, 4) + 8) }}>
            <div style={{ position: "absolute", right: 14, bottom: 10, fontSize: 26, color: C.pink, fontWeight: 700 }}>the long tail</div>
          </Abs>
        )}
      </div>

      {/* right panel */}
      <Abs x={1270} y={262} w={570} style={{ opacity: 1 - branch }}>
        <div style={{ ...card(), padding: 30 }}>
          <div style={{ fontSize: 26, color: C.muted, fontWeight: 700 }}>TEMPERATURE</div>
          <div style={{ fontSize: 72, fontWeight: 900, fontFamily: MONO, color: T < 0.6 ? C.cyan : T > 1.4 ? C.pink : C.text }}>{T.toFixed(2)}</div>
          <div style={{ position: "relative", height: 14, background: C.line, borderRadius: 7, marginTop: 10 }}>
            <div style={{ position: "absolute", left: `${(T / 2) * 100}%`, top: -9, width: 32, height: 32, marginLeft: -16, borderRadius: 999, background: C.text }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: C.faint, marginTop: 10 }}>
            <span>0 · predictable</span>
            <span>2 · varied</span>
          </div>
          {topP > 0 && <div style={{ marginTop: 24, fontSize: 32, fontWeight: 800, color: C.green }}>top-p = {topP}</div>}
        </div>
        {mode === "basic" && t.step >= 2 && (
          <div style={{ ...card(), padding: 26, marginTop: 24, display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ fontSize: 80, transform: `rotate(${t.step === 2 && !landed ? rf * 23 : 0}deg)` }}>🎲</div>
            <div style={{ fontSize: 30, fontWeight: 700 }}>
              {t.step === 2 ? (landed ? "rolled: within" : "rolling…") : `roll #${1 + nExtra}`}
              <div style={{ fontSize: 24, color: C.muted, fontWeight: 500 }}>{t.step >= 3 ? "100 tokens = 100 rolls" : "within: 62 of 100 rolls"}</div>
            </div>
          </div>
        )}
        {mode === "temp" && t.step >= 6 && (
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16, ...rise(f, at(t, 6)) }}>
            <div style={{ ...card(C.cyan), padding: "18px 24px", fontSize: 30, fontWeight: 700 }}>Refund rules → low temperature</div>
            <div style={{ ...card(C.pink), padding: "18px 24px", fontSize: 30, fontWeight: 700 }}>10 subject lines → higher temperature</div>
          </div>
        )}
      </Abs>

      {branch > 0 && (
        <>
          <Abs x={80} y={330} w={1760} style={{ fontSize: 30, color: C.muted, fontWeight: 700, opacity: branch }}>
            One different early roll → a different answer
          </Abs>
          {[
            { tok: "within", rest: " 6 hours of delivery.", col: C.blue },
            { tok: "only", rest: " if the problem is reported in the first 6 hours.", col: C.pink },
          ].map((b, i) => (
            <Abs key={i} x={80} y={420 + i * 170} w={1760} style={{ ...card(b.col), padding: "26px 32px", fontSize: 38, opacity: enter(f, at(t, 4) + i * 16), transform: `translateX(${(1 - enter(f, at(t, 4) + i * 16)) * 60}px)` }}>
              <span style={{ color: C.muted }}>Bakery items can be refunded </span>
              <span style={{ color: b.col, fontWeight: 900, background: `${b.col}22`, borderRadius: 8, padding: "0 8px" }}>{b.tok}</span>
              <span>{b.rest}</span>
            </Abs>
          ))}
        </>
      )}
    </>
  );
};
