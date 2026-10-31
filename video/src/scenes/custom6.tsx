// Chapter 4 scenes (when retrieval still fails): find where it breaks, then
// fix the question, check the evidence, walk the trace backwards, and parse
// documents properly. Text boxes set a width, never a height, and nothing
// sits in the top-right corner where the term card lands.
import type { ReactNode } from "react";
import type { Clock } from "../lib/timeline.ts";
import { C, MONO } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, Big, clamp01, during, from, rnd } from "./custom3.tsx";

type CP = { t: Clock; props?: Record<string, unknown> };

const Arrow = ({ x1, y1, x2, y2, color = C.muted, p = 1, dash }: { x1: number; y1: number; x2: number; y2: number; color?: string; p?: number; dash?: boolean }) => {
  const ex = lerp(x1, x2, p);
  const ey = lerp(y1, y2, p);
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g>
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={4} strokeDasharray={dash ? "10 10" : undefined} strokeLinecap="round" />
      {p > 0.95 && <polygon points={`${x2},${y2} ${x2 - 18 * Math.cos(a - 0.42)},${y2 - 18 * Math.sin(a - 0.42)} ${x2 - 18 * Math.cos(a + 0.42)},${y2 - 18 * Math.sin(a + 0.42)}`} fill={color} />}
    </g>
  );
};

const Svg = ({ children }: { children: ReactNode }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

// ------------------------------------------------------------------ where does it break?

export const WhereMap = ({ t }: CP) => {
  const f = t.frame;
  const st = [
    { x: 150, label: "❓ question" },
    { x: 590, label: "🔎 search" },
    { x: 1030, label: "📋 the prompt" },
    { x: 1470, label: "💬 answer" },
  ];
  const y = 450;
  const faults: { step: number; x: number; y: number; text: string }[] = [
    { step: 1, x: 150, y: 330, text: "vague · follow-ups" },
    { step: 2, x: 590, y: 330, text: "weak results" },
    { step: 3, x: 1470, y: 330, text: "right doc, wrong answer" },
    { step: 4, x: 940, y: 760, text: "tables · scans" },
  ];
  const ring = (i: number) => (t.step === i ? 0.5 + 0.5 * Math.sin((f - at(t, i)) / 5) : 0);
  const dot = ((f % 120) / 120) * 4;
  return (
    <>
      <Svg>
        {st.slice(0, 3).map((s, i) => (
          <Arrow key={i} x1={s.x + 300} y1={y + 55} x2={st[i + 1].x - 10} y2={y + 55} p={ease(f, 10 + i * 10, 16)} />
        ))}
        <Arrow x1={740} y1={720} x2={740} y2={y + 125} p={ease(f, 50, 16)} />
        {f > 60 && dot < 3 && <circle cx={lerp(st[Math.floor(dot)].x + 300, st[Math.floor(dot) + 1].x, dot % 1)} cy={y + 55} r={10} fill={C.blue} />}
      </Svg>
      {st.map((s, i) => {
        const bad = faults.find((q) => q.step === t.step && q.x === s.x);
        return (
          <Abs key={s.label} x={s.x} y={y} w={300} style={{ ...card(bad ? C.red : C.line), padding: "28px 20px", textAlign: "center", fontSize: 36, fontWeight: 800, boxShadow: bad ? `0 0 ${50 * ring(t.step)}px ${C.red}` : undefined, ...rise(f, 4 + i * 10) }}>
            {s.label}
          </Abs>
        );
      })}
      <Abs x={590} y={720} w={300} style={{ ...card(t.step === 4 ? C.red : C.line), padding: "22px 20px", textAlign: "center", fontSize: 32, fontWeight: 800, boxShadow: t.step === 4 ? `0 0 ${50 * ring(4)}px ${C.red}` : undefined, ...rise(f, 50) }}>
        📄 documents
      </Abs>
      {faults.map((q) =>
        t.step >= q.step ? (
          <Abs key={q.text} x={q.x} y={q.y} w={q.step === 4 ? 520 : 300} style={{ textAlign: q.step === 4 ? "left" : "center", fontSize: 30, fontWeight: 800, color: t.step === q.step ? C.red : C.faint, ...rise(f, at(t, q.step)) }}>
            ⚠ {q.text}
          </Abs>
        ) : null,
      )}
    </>
  );
};

// ------------------------------------------------------------------ multi-query and decomposition

export const Rewrite = ({ t }: CP) => {
  const f = t.frame;
  const sharp = ["app crash after the 5.2 update", "checkout error in the new release", "payment fails since last update"];
  const moved = ease(f, at(t, 1), 24);
  return (
    <>
      {t.step < 3 && (
        <div style={{ opacity: 1 - from(t, 3) }}>
          <Abs x={lerp(460, 100, moved)} y={lerp(300, 440, moved)} w={lerp(1000, 560, moved)} style={{ ...card(C.amber), padding: "24px 30px", fontSize: lerp(42, 30, moved), fontWeight: 700, ...rise(f, 4) }}>
            “it keeps failing after the update, what changed?”
          </Abs>
          {t.step === 0 &&
            Array.from({ length: 9 }, (_, i) => (
              <Abs key={i} x={300 + (i % 5) * 270} y={560 + Math.floor(i / 5) * 100} w={230} style={{ ...card(), padding: "12px 16px", fontSize: 24, color: C.faint, opacity: enter(f, 40 + i * 6) * 0.9, transform: `rotate(${(rnd(i) - 0.5) * 10}deg)` }}>
                {["noise", "app tips", "an old FAQ", "promo", "noise", "release notes", "random", "noise", "?"][i]}
              </Abs>
            ))}
          {t.step >= 1 && (
            <>
              <Svg>
                {sharp.map((_, i) => (
                  <Arrow key={i} x1={680} y1={500} x2={790} y2={330 + i * 150} p={ease(f, at(t, 1) + 20 + i * 8, 14)} color={C.blue} />
                ))}
                {t.step >= 2 && sharp.map((_, i) => <Arrow key={`r${i}`} x1={1380} y1={330 + i * 150} x2={1470} y2={480} p={ease(f, at(t, 2) + i * 8, 14)} color={C.green} />)}
              </Svg>
              {sharp.map((s, i) => (
                <Abs key={s} x={800} y={290 + i * 150} w={570} style={{ ...card(C.blue), padding: "18px 24px", fontSize: 30, fontWeight: 700, opacity: Math.min(1, pop(f, at(t, 1) + 28 + i * 10)) }}>
                  🔎 {s}
                </Abs>
              ))}
              {t.step >= 2 && (
                <Abs x={1480} y={420} w={340} style={{ ...card(C.green), padding: "20px 24px", textAlign: "center", ...rise(f, at(t, 2) + 24) }}>
                  <div style={{ fontSize: 32, fontWeight: 800 }}>one list</div>
                  <div style={{ fontSize: 24, color: C.muted, marginTop: 6 }}>merged with RRF, from chapter 3</div>
                </Abs>
              )}
            </>
          )}
        </div>
      )}
      {t.step >= 3 && (
        <div style={{ opacity: from(t, 3) }}>
          <Abs x={110} y={420} w={640} style={{ ...card(C.amber), padding: "24px 30px", fontSize: 34, fontWeight: 700, ...rise(f, at(t, 3)) }}>
            “compare the Pune and Bengaluru slot rules”
          </Abs>
          <Svg>
            <Arrow x1={770} y1={470} x2={900} y2={360} p={ease(f, at(t, 3) + 30, 14)} color={C.blue} />
            <Arrow x1={770} y1={490} x2={900} y2={610} p={ease(f, at(t, 3) + 36, 14)} color={C.blue} />
            <Arrow x1={1400} y1={370} x2={1500} y2={470} p={ease(f, at(t, 3) + 80, 14)} color={C.green} />
            <Arrow x1={1400} y1={610} x2={1500} y2={510} p={ease(f, at(t, 3) + 86, 14)} color={C.green} />
          </Svg>
          {["Pune slot rules?", "Bengaluru slot rules?"].map((q, i) => (
            <Abs key={q} x={910} y={310 + i * 250} w={480} style={{ ...card(C.blue), padding: "18px 24px", fontSize: 32, fontWeight: 700, opacity: Math.min(1, pop(f, at(t, 3) + 44 + i * 8)) }}>
              🔎 {q}
            </Abs>
          ))}
          <Abs x={1510} y={440} w={330} style={{ ...card(C.green), padding: "20px 24px", textAlign: "center", fontSize: 30, fontWeight: 800, ...rise(f, at(t, 3) + 96) }}>
            one combined answer
          </Abs>
          {t.step >= 4 && (
            <Abs x={110} y={780} w={1700} style={{ display: "flex", gap: 24, justifyContent: "center", ...rise(f, at(t, 4)) }}>
              <Chip color={C.amber} style={{ fontSize: 30 }}>+1 model call · more waiting</Chip>
              <Chip color={C.green} style={{ fontSize: 30 }}>turn it on only where your tests show the failure</Chip>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ HyDE: search with a fake answer

export const Hyde = ({ t }: CP) => {
  const f = t.frame;
  const cluster = Array.from({ length: 14 }, (_, i) => ({ x: 1150 + rnd(i) * 420, y: 470 + rnd(i + 30) * 280 }));
  const fly = ease(f, at(t, 2) + 70, 30);
  const fake = "Spoiled milk can be refunded within 24 hours if the customer sends a photo of the pack…";
  const typed = t.step >= 2 ? Math.floor(clamp01((f - at(t, 2) - 6) / 60) * fake.length) : 0;
  return (
    <>
      <Abs x={1140} y={800} w={460} style={{ textAlign: "center", fontSize: 28, color: C.green, fontWeight: 700, ...rise(f, 20) }}>answer paragraphs live here</Abs>
      <Svg>
        <ellipse cx={1360} cy={610} rx={290} ry={190} fill={`${C.green}12`} stroke={`${C.green}55`} strokeWidth={2} opacity={enter(f, 6)} />
        {cluster.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={60} height={34} rx={6} fill={C.green} opacity={0.75 * enter(f, 10 + i * 3)} />
        ))}
        {t.step >= 1 && t.step < 3 && (
          <line x1={420} y1={380} x2={1150} y2={600} stroke={C.red} strokeWidth={3} strokeDasharray="12 10" opacity={enter(f, at(t, 1) + 20) * (1 - fly)} />
        )}
      </Svg>
      {t.step >= 1 && (
        <Abs x={200} y={340} w={440} style={{ ...card(C.amber), padding: "14px 22px", fontSize: 30, fontWeight: 700, ...rise(f, at(t, 1)) }}>
          “refund for spoiled milk?”
          <div style={{ fontSize: 22, color: C.muted, fontWeight: 500 }}>short · shaped like a question</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs
          x={lerp(120, 1250, fly)}
          y={lerp(520, 560, fly)}
          w={lerp(620, 220, fly)}
          style={{ ...card(C.purple), padding: lerp(24, 10, fly), fontSize: lerp(28, 12, fly), lineHeight: 1.35, opacity: enter(f, at(t, 2)), boxShadow: fly > 0.95 ? `0 0 40px ${C.purple}` : undefined }}
        >
          {fly < 0.2 && <div style={{ fontSize: 22, fontWeight: 800, color: C.purple, marginBottom: 6 }}>🤖 a fake answer</div>}
          {fake.slice(0, typed)}
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={120} y={800} w={900} style={{ ...rise(f, at(t, 3)) }}>
          <Chip color={C.red} style={{ fontSize: 28 }}>⚠ a confidently wrong fake pulls in the wrong documents</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ condensing a follow-up

export const Condense = ({ t }: CP) => {
  const f = t.frame;
  const bubble = (who: "u" | "b", text: string, start: number, color?: string) => (
    <div style={{ display: "flex", justifyContent: who === "u" ? "flex-end" : "flex-start", marginBottom: 18, ...rise(f, start) }}>
      <div style={{ maxWidth: 560, padding: "16px 24px", borderRadius: 22, fontSize: 30, fontWeight: 600, background: who === "u" ? C.blue : C.card2, color: who === "u" ? "#08101f" : C.text, border: color ? `3px solid ${color}` : undefined }}>{text}</div>
    </div>
  );
  return (
    <>
      <Abs x={100} y={230} w={720}>
        {bubble("u", "What is the refund window for dairy?", 6)}
        {bubble("b", "24 hours, with a photo.", 24)}
        {bubble("u", "And for bakery?", 44, t.step === 1 ? C.red : undefined)}
        {t.step >= 3 && bubble("b", "Unlike dairy, bakery is 12 hours.", at(t, 3) + 10)}
      </Abs>
      {t.step === 1 && (
        <div style={{ opacity: during(t, 1) }}>
          <Svg>
            <Arrow x1={830} y1={470} x2={1000} y2={420} p={ease(f, at(t, 1) + 10, 14)} />
          </Svg>
          <Abs x={1010} y={350} w={760} style={{ ...card(C.red), padding: "22px 28px", ...rise(f, at(t, 1) + 20) }}>
            <div style={{ fontSize: 30, fontFamily: MONO }}>search(“And for bakery?”)</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: C.red, marginTop: 10 }}>0 relevant results</div>
          </Abs>
        </div>
      )}
      {t.step >= 2 && (
        <div style={{ opacity: from(t, 2) }}>
          <Svg>
            <Arrow x1={830} y1={360} x2={990} y2={430} p={ease(f, at(t, 2) + 10, 14)} color={C.purple} />
            <Arrow x1={830} y1={480} x2={990} y2={460} p={ease(f, at(t, 2) + 14, 14)} color={C.purple} />
            <Arrow x1={1340} y1={540} x2={1340} y2={610} p={ease(f, at(t, 2) + 50, 14)} color={C.green} />
          </Svg>
          <Abs x={1000} y={390} w={680} style={{ ...card(C.purple), padding: "20px 26px", textAlign: "center", fontSize: 32, fontWeight: 800, ...rise(f, at(t, 2)) }}>
            🤖 rewrite it using the chat
          </Abs>
          <Abs x={1000} y={630} w={680} style={{ ...card(C.green), padding: "20px 26px", fontSize: 32, fontWeight: 700, opacity: Math.min(1, pop(f, at(t, 2) + 60)) }}>
            “What is the refund window for bakery?”
            <div style={{ fontSize: 26, color: C.green, marginTop: 8 }}>🔎 search ✓ finds the bakery policy</div>
          </Abs>
          {t.step >= 3 && (
            <Abs x={1000} y={830} w={760} style={{ fontSize: 26, color: C.muted, ...rise(f, at(t, 3) + 40) }}>
              search sees only the rewrite · the answer still sees the chat
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ corrective RAG: grade, retry, fall back

export const Corrective = ({ t }: CP) => {
  const f = t.frame;
  const loopOn = t.step >= 2;
  // the token's trip: search → grader → rewrite → search → grader → answer
  const path = [
    [440, 520],
    [820, 520],
    [820, 760],
    [440, 760],
    [440, 520],
    [820, 520],
    [1240, 520],
  ];
  const lp = loopOn ? clamp01((f - at(t, 2) - 30) / 180) * (path.length - 1) : 0;
  const seg = Math.min(path.length - 2, Math.floor(lp));
  const tx = lerp(path[seg][0], path[seg + 1][0], lp - seg);
  const ty = lerp(path[seg][1], path[seg + 1][1], lp - seg);
  const tries = lp >= 3 ? 1 : 0;
  const graderNo = loopOn && lp >= 1 && lp < 2.2;
  const graderYes = loopOn && lp >= 5;
  return (
    <>
      {t.step < 2 && (
        <div style={{ opacity: 1 - from(t, 2) }}>
          {t.step === 0 && (
            <div style={{ opacity: during(t, 0) }}>
              {["a promo banner", "an old FAQ", "app tips", "noise", "release notes"].map((s, i) => (
                <Abs key={s} x={200} y={260 + i * 100} w={500} style={{ ...card(), padding: "14px 22px", fontSize: 28, color: C.faint, ...rise(f, 6 + i * 6) }}>
                  {i + 1}. {s}
                </Abs>
              ))}
              <Svg>
                <Arrow x1={740} y1={500} x2={980} y2={500} p={ease(f, 50, 14)} />
              </Svg>
              <Abs x={1000} y={430} w={620} style={{ ...card(C.red), padding: "22px 28px", ...rise(f, 64) }}>
                <div style={{ fontSize: 34, fontWeight: 800 }}>💬 answers anyway</div>
                <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>from evidence that doesn't answer the question</div>
              </Abs>
            </div>
          )}
          {t.step === 1 && (
            <div style={{ opacity: during(t, 1) }}>
              <Abs x={0} y={300} w={1920} style={{ textAlign: "center", fontSize: 180, ...rise(f, at(t, 1)) }}>🧑‍🎓📖</Abs>
              <Abs x={0} y={560} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 1) + 30) }}>
                <Big size={52}>“Wrong chapter. Let me look again.”</Big>
              </Abs>
            </div>
          )}
        </div>
      )}
      {loopOn && (
        <div style={{ opacity: from(t, 2) }}>
          <Svg>
            <Arrow x1={590} y1={520} x2={720} y2={520} p={ease(f, at(t, 2) + 4, 12)} />
            <Arrow x1={920} y1={520} x2={1080} y2={520} p={ease(f, at(t, 2) + 10, 12)} color={C.green} />
            <Arrow x1={820} y1={600} x2={820} y2={700} p={ease(f, at(t, 2) + 14, 12)} color={C.red} />
            <Arrow x1={650} y1={760} x2={460} y2={600} p={ease(f, at(t, 2) + 20, 12)} color={C.red} />
            <polygon points="820,440 920,520 820,600 720,520" fill={C.card} stroke={graderNo ? C.red : graderYes ? C.green : C.amber} strokeWidth={4} />
            <circle cx={tx} cy={ty} r={14} fill={C.blue} opacity={lp > 0 && lp < path.length - 1 ? 1 : 0} />
          </Svg>
          <Abs x={300} y={470} w={280} style={{ ...card(C.blue), padding: "20px 0", textAlign: "center", fontSize: 32, fontWeight: 800 }}>🔎 search</Abs>
          <Abs x={760} y={500} w={120} style={{ textAlign: "center", fontSize: 26, fontWeight: 800 }}>grade</Abs>
          <Abs x={940} y={470} w={160} style={{ textAlign: "center", fontSize: 26, color: C.green, fontWeight: 700 }}>relevant</Abs>
          <Abs x={840} y={620} w={160} style={{ fontSize: 26, color: C.red, fontWeight: 700 }}>not yet</Abs>
          <Abs x={1100} y={470} w={300} style={{ ...card(graderYes ? C.green : C.line), padding: "20px 0", textAlign: "center", fontSize: 32, fontWeight: 800 }}>💬 answer</Abs>
          <Abs x={640} y={720} w={420} style={{ ...card(C.red), padding: "16px 20px", textAlign: "center", fontSize: 28, fontWeight: 800 }}>✏️ rewrite the question</Abs>
          <Abs x={300} y={300} w={460} style={{ fontFamily: MONO, fontSize: 32, fontWeight: 700, color: tries ? C.amber : C.muted }}>tries: {tries} of 2</Abs>
          {t.step >= 3 && (
            <Abs x={1440} y={300} w={420} style={{ display: "flex", flexDirection: "column", gap: 18, ...rise(f, at(t, 3)) }}>
              <div style={{ fontSize: 30, fontWeight: 800 }}>three brakes</div>
              {["🔢 a tries counter", "🧱 a hard step limit", "🪂 fallback: best so far, or “not found”"].map((b, i) => (
                <div key={b} style={{ ...card(C.amber), padding: "14px 20px", fontSize: 26, fontWeight: 700, ...rise(f, at(t, 3) + 20 + i * 20) }}>{b}</div>
              ))}
            </Abs>
          )}
          {t.step >= 4 && (
            <Abs x={0} y={860} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 4)) }}>
              <Big size={46} color={C.green}>never an empty answer · never an invented one</Big>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ walk the trace backwards

export const Backwards = ({ t }: CP) => {
  const f = t.frame;
  const checks = ["indexed, current, visible?", "in the search results?", "reached the prompt, near the top?", "so: the answer step"];
  return (
    <>
      {t.step < 2 && (
        <div style={{ opacity: 1 - from(t, 2) }}>
          <Abs x={360} y={260} w={1200} style={{ ...card(C.red), padding: "30px 36px", ...rise(f, 4) }}>
            <div style={{ fontSize: 26, color: C.muted }}>💬 Ask FreshCart</div>
            <div style={{ fontSize: 44, fontWeight: 800, marginTop: 8 }}>Bakery refunds: within 48 hours.</div>
            <div style={{ fontSize: 26, color: C.blue, marginTop: 8 }}>[source: refund-policy.pdf]</div>
          </Abs>
          <Abs x={360} y={520} w={1200} style={{ display: "flex", gap: 20, ...rise(f, 30) }}>
            <Chip color={C.green}>search ✓</Chip>
            <Chip color={C.green}>grader ✓</Chip>
            <Chip color={C.red}>policy says 12 ✗</Chip>
          </Abs>
          {t.step >= 1 && (
            <Abs x={0} y={680} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 1)) }}>
              <Big size={48}>
                <span style={{ color: C.red, textDecoration: "line-through" }}>edit the prompt and hope</span> → walk backwards, with evidence
              </Big>
            </Abs>
          )}
        </div>
      )}
      {t.step >= 2 && t.step < 4 && (
        <div style={{ opacity: from(t, 2) * (1 - from(t, 4)) }}>
          <Abs x={120} y={250} w={720} style={{ ...card(C.blue), padding: "22px 28px", ...rise(f, at(t, 2)) }}>
            <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 12 }}>🧾 one question's record</div>
            {["rewritten query", "every chunk found + score", "what the reranker kept", "the exact final prompt", "the answer · time · tokens"].map((r, i) => (
              <div key={r} style={{ fontSize: 26, fontFamily: MONO, color: C.muted, padding: "6px 0", borderTop: i ? `1px solid ${C.line}` : undefined, ...rise(f, at(t, 2) + 14 + i * 8, 10) }}>
                {r}
              </div>
            ))}
          </Abs>
          {t.step >= 3 &&
            checks.map((c, i) => {
              const s = at(t, 3) + 10 + i * 34;
              const last = i === 3;
              return (
                <Abs key={c} x={940} y={260 + i * 130} w={860} style={{ ...card(last ? C.red : C.green), padding: "18px 26px", display: "flex", gap: 18, alignItems: "center", fontSize: 30, fontWeight: 700, opacity: Math.min(1, pop(f, s)) }}>
                  <span style={{ fontSize: 34, color: last ? C.red : C.green }}>{last ? "🔍" : "✓"}</span>
                  {c}
                </Abs>
              );
            })}
        </div>
      )}
      {t.step >= 4 && (
        <div style={{ opacity: from(t, 4) }}>
          <Abs x={0} y={250} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 4)) }}>
            <Big size={46}>the prompt held two bakery chunks</Big>
          </Abs>
          {[
            ["refund policy · 2023", "48 hours", C.red, "never deleted"],
            ["refund policy · current", "12 hours", C.green, "the real one"],
          ].map(([h, v, col, note], i) => (
            <Abs key={h} x={300 + i * 700} y={380} w={620} style={{ ...card(col), padding: "26px 30px", opacity: Math.min(1, pop(f, at(t, 4) + 20 + i * 14)) }}>
              <div style={{ fontSize: 28, color: C.muted }}>{h}</div>
              <div style={{ fontSize: 56, fontWeight: 900, color: col, marginTop: 6 }}>{v}</div>
              <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>{note}</div>
            </Abs>
          ))}
          {t.step >= 5 && (
            <Abs x={300} y={700} w={1320} style={{ ...card(C.amber), padding: "22px 30px", ...rise(f, at(t, 5)) }}>
              <div style={{ fontSize: 32, fontWeight: 800 }}>fix the data, not the prompt</div>
              <div style={{ fontSize: 28, fontFamily: MONO, color: C.muted, marginTop: 10 }}>version · effective_from · status: superseded → filtered out</div>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ lost in the middle

export const LostMiddle = ({ t }: CP) => {
  const f = t.frame;
  const n = 7;
  const acc = [0.82, 0.72, 0.62, 0.55, 0.6, 0.68, 0.76];
  const walk = t.step >= 1 ? clamp01((f - at(t, 1) - 20) / 150) * (n - 1) : 0;
  const pos = Math.round(walk);
  const gx = (i: number) => 420 + i * 180;
  const gy = (a: number) => 840 - (a - 0.4) * 600;
  const shown = t.step >= 1 ? Math.floor(walk) + 1 : 0;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const hit = t.step >= 1 && i === pos;
        return (
          <Abs key={i} x={gx(i) - 70} y={300} w={140} style={{ ...card(hit ? C.amber : C.line), padding: "18px 0", textAlign: "center", fontSize: 26, fontWeight: 700, color: hit ? C.amber : C.faint, opacity: Math.min(1, pop(f, 6 + i * 5)) }}>
            {hit ? "answer" : "passage"}
          </Abs>
        );
      })}
      <Abs x={160} y={310} w={220} style={{ fontSize: 26, color: C.muted, ...rise(f, 10) }}>the prompt →</Abs>
      {t.step >= 1 && (
        <>
          <Svg>
            <line x1={gx(0) - 40} y1={gy(0.4)} x2={gx(n - 1) + 40} y2={gy(0.4)} stroke={C.line} strokeWidth={2} />
            <polyline points={acc.slice(0, shown).map((a, i) => `${gx(i)},${gy(a)}`).join(" ")} fill="none" stroke={C.amber} strokeWidth={5} />
            {acc.slice(0, shown).map((a, i) => (
              <circle key={i} cx={gx(i)} cy={gy(a)} r={9} fill={C.amber} />
            ))}
          </Svg>
          <Abs x={160} y={560} w={240} style={{ fontSize: 26, color: C.muted }}>accuracy (illustrative)</Abs>
        </>
      )}
      {t.step >= 2 && (
        <Abs x={0} y={855} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 2)) }}>
          <Chip color={C.green} style={{ fontSize: 32 }}>fewer, better chunks · the best one first</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ a PDF table, shredded vs parsed

export const Shred = ({ t }: CP) => {
  const f = t.frame;
  const rows = [
    ["Dairy", "24 h", "photo"],
    ["Bakery", "12 h", "photo"],
    ["Frozen", "6 h", "none"],
  ];
  const scan = t.step >= 1 ? clamp01((f - at(t, 1) - 10) / 90) : 0;
  return (
    <>
      {t.step === 0 && (
        <div style={{ opacity: during(t, 0) }}>
          <Abs x={0} y={250} w={1920} style={{ textAlign: "center", ...rise(f, 4) }}>
            <Big size={46}>a chunk the search engine sees:</Big>
          </Abs>
          <Abs x={360} y={400} w={1200} style={{ ...card(C.red), padding: "30px 36px", fontFamily: MONO, fontSize: 34, color: C.muted, ...rise(f, 20) }}>
            Dairy 24 Bakery 12 Frozen 6 Photo Photo None FreshCart Confidential · Page 7
          </Abs>
        </div>
      )}
      {t.step >= 1 && t.step < 3 && (
        <div style={{ opacity: from(t, 1) * (1 - from(t, 3)) }}>
          {/* the page: two columns of prose, a table, a footer */}
          <Abs x={160} y={240} w={720} style={{ background: "#e9edf4", borderRadius: 10, padding: 30, color: "#334", ...rise(f, at(t, 1)) }}>
            <div style={{ display: "flex", gap: 30 }}>
              {[0, 1].map((c) => (
                <div key={c} style={{ flex: 1 }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} style={{ height: 12, background: "#b9c1d0", borderRadius: 6, marginBottom: 12, width: `${70 + rnd(i + c * 9) * 30}%` }} />
                  ))}
                </div>
              ))}
            </div>
            <div style={{ border: "2px solid #8a94a8", borderRadius: 6, marginTop: 10 }}>
              {[["Category", "Window", "Proof"], ...rows].map((r, i) => (
                <div key={i} style={{ display: "flex", borderTop: i ? "1px solid #b9c1d0" : undefined, fontWeight: i ? 500 : 800, fontSize: 24 }}>
                  {r.map((c) => (
                    <div key={c} style={{ flex: 1, padding: "6px 12px" }}>{c}</div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 18, color: "#778", marginTop: 14, textAlign: "center" }}>FreshCart Confidential · Page 7</div>
          </Abs>
          <Svg>
            <line x1={170} y1={lerp(280, 700, scan)} x2={870} y2={lerp(280, 700, scan)} stroke={C.red} strokeWidth={4} opacity={scan > 0 && scan < 1 ? 1 : 0} />
          </Svg>
          <Abs x={980} y={260} w={800} style={{ ...rise(f, at(t, 1) + 40) }}>
            <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 14 }}>the first parser:</div>
            {["read straight across both columns", "flattened the table into one line", "kept the footer: 40 copies of “Page 7”"].map((s, i) => (
              <div key={s} style={{ ...card(C.red), padding: "14px 22px", fontSize: 28, fontWeight: 600, marginBottom: 14, ...rise(f, at(t, 1) + 60 + i * 24) }}>✗ {s}</div>
            ))}
          </Abs>
          {t.step >= 2 && (
            <Abs x={0} y={820} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 2)) }}>
              <Big size={44} color={C.amber}>search can only be as good as this text</Big>
            </Abs>
          )}
        </div>
      )}
      {t.step >= 3 && (
        <div style={{ opacity: from(t, 3) }}>
          <Abs x={160} y={250} w={1100} style={{ ...rise(f, at(t, 3)) }}>
            <Big size={40}>parse with layout: one row → one sentence</Big>
          </Abs>
          {rows.map(([c, w, p], i) => (
            <Abs key={c} x={160} y={350 + i * 120} w={1100} style={{ ...card(C.green), padding: "18px 26px", fontSize: 30, fontFamily: MONO, opacity: Math.min(1, pop(f, at(t, 3) + 30 + i * 14)) }}>
              Category: {c}. Window: {w.replace(" h", " hours")}. Proof: {p}.
            </Abs>
          ))}
          {t.step >= 4 && (
            <Abs x={160} y={740} w={1600} style={{ display: "flex", gap: 24, ...rise(f, at(t, 4)) }}>
              <Chip color={C.amber} style={{ fontSize: 28 }}>📷 scans need OCR: “24h” can come out as “2411”</Chip>
              <Chip color={C.blue} style={{ fontSize: 28 }}>huge tables → a database</Chip>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};
