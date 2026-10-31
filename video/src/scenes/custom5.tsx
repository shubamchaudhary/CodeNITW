// Chapter 3 scenes (fast, correct search) plus CardList, a reusable list of
// problems or ideas that pop in one per step. Text boxes here size to their
// text: width is set, height never is.
import type { Clock } from "../lib/timeline.ts";
import { C, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, Big, clamp01, during, from, rnd } from "./custom3.tsx";

type CP = { t: Clock; props?: Record<string, unknown> };

// ------------------------------------------------------------------ a list of cards, one per step

export const CardList = ({ t, props }: CP) => {
  const f = t.frame;
  const title = (props?.title as string) ?? "";
  const items = (props?.items as string[][]) ?? [];
  const pause = props?.pause as string | undefined;
  const gap = items.length > 3 ? 150 : 175;
  return (
    <>
      <Abs x={0} y={150} w={1920} style={{ textAlign: "center", ...rise(f, 4) }}>
        <Big size={58}>{title}</Big>
      </Abs>
      {items.map(([icon, head, sub], i) => {
        const st = at(t, i + 1);
        const p = Math.min(1, pop(f, st));
        const col = PALETTE[i % PALETTE.length];
        return (
          <Abs key={head} x={260} y={280 + i * gap} w={1400} style={{ opacity: p, transform: `translateX(${(1 - p) * 160}px)` }}>
            <div style={{ ...card(t.step === i + 1 ? col : C.line), padding: "18px 30px", display: "flex", alignItems: "center", gap: 28 }}>
              <div style={{ fontSize: 56, flexShrink: 0 }}>{icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.2 }}>{head}</div>
                {sub && <div style={{ fontSize: 28, color: C.muted, marginTop: 4 }}>{sub}</div>}
              </div>
            </div>
          </Abs>
        );
      })}
      {pause && t.step >= t.beats.length - 1 && (
        <Abs x={160} y={280 + items.length * gap + 10} w={1600} style={{ textAlign: "center", ...rise(f, at(t, t.beats.length - 1) + 40) }}>
          <Big size={40} color={C.amber}>⏸ {pause}</Big>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ brute force vs the neighbourhood

export const BruteForce = ({ t }: CP) => {
  const f = t.frame;
  const n = 900;
  const scan = t.step === 0 ? clamp01((f - 20) / 140) : 1;
  const home = { x: 960, y: 560 };
  return (
    <>
      {t.step === 0 && (
        <div style={{ opacity: during(t, 0) }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: n }, (_, i) => {
              const x = 200 + (i % 45) * 34;
              const y = 230 + Math.floor(i / 45) * 30;
              const done = i / n < scan;
              return <rect key={i} x={x} y={y} width={22} height={18} rx={3} fill={done ? C.amber : C.card2} />;
            })}
          </svg>
          <Abs x={0} y={860} w={1920} style={{ textAlign: "center" }}>
            <span style={{ fontFamily: MONO, fontSize: 48, fontWeight: 800, color: C.amber }}>{Math.round(scan * 2000000).toLocaleString("en-US")}</span>
            <span style={{ fontSize: 36, color: C.muted }}> / 2,000,000 cards compared</span>
          </Abs>
        </div>
      )}
      {t.step >= 1 && (
        <div style={{ opacity: from(t, 1) }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 70 }, (_, i) => {
              const x = 120 + rnd(i) * 1680;
              const y = 180 + rnd(i + 50) * 720;
              const near = Math.hypot(x - home.x, y - home.y) < 190;
              const brute = t.step === 1;
              const lineP = brute ? clamp01((f - at(t, 1) - i * 1.2) / 10) : 0;
              return (
                <g key={i}>
                  {brute && lineP > 0 && <line x1={home.x} y1={home.y} x2={lerp(home.x, x, lineP)} y2={lerp(home.y, y, lineP)} stroke={C.red} strokeWidth={2} opacity={0.45} />}
                  <text x={x} y={y} fontSize={34} textAnchor="middle" opacity={t.step >= 2 && !near ? 0.25 : 1}>☕</text>
                </g>
              );
            })}
            {t.step >= 2 && <circle cx={home.x} cy={home.y} r={190 * ease(f, at(t, 2), 26)} fill={`${C.green}18`} stroke={C.green} strokeWidth={5} />}
            <text x={home.x} y={home.y + 18} fontSize={60} textAnchor="middle">🏠</text>
          </svg>
          {t.step >= 3 && (
            <Abs x={1240} y={780} w={600} style={{ ...card(C.green), padding: "18px 26px", fontSize: 32, fontWeight: 700, ...rise(f, at(t, 3)) }}>
              ✓ milliseconds <span style={{ color: C.muted, fontWeight: 500 }}>· occasionally misses one</span>
            </Abs>
          )}
          {t.step >= 4 && (
            <Abs x={80} y={780} w={700} style={{ ...card(C.amber), padding: "18px 26px", fontSize: 32, fontWeight: 700, ...rise(f, at(t, 4)) }}>
              recall 0.95 = <span style={{ color: C.amber }}>9.5 of the true 10</span>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ HNSW: highways and local roads

export const Hnsw = ({ t }: CP) => {
  const f = t.frame;
  const layers = [
    { y: 300, n: 4, name: "highways", col: C.pink },
    { y: 540, n: 9, name: "main roads", col: C.amber },
    { y: 780, n: 22, name: "local streets: every card", col: C.blue },
  ];
  const pts = layers.map((l, li) => Array.from({ length: l.n }, (_, i) => ({ x: 320 + ((i + 0.5) / l.n) * 1280 + (rnd(i + li * 40) - 0.5) * (1100 / l.n), y: l.y + (rnd(i * 3 + li) - 0.5) * 70 })));
  const shown = (li: number) => (t.step >= 2 ? enter(f, at(t, 2) + li * 20) : li === 0 && t.step === 1 ? 0 : 0);
  // the search path: highway hops, drop, main-road hops, drop, local hops
  const path = [pts[0][0], pts[0][2], { x: pts[0][2].x, y: pts[1][5].y }, pts[1][6], { x: pts[1][6].x, y: pts[2][15].y }, pts[2][16], pts[2][17]];
  const walk = t.step >= 3 ? clamp01((f - at(t, 3) - 10) / 90) : 0;
  const segs = path.length - 1;
  const pos = (() => {
    const k = Math.min(segs - 1, Math.floor(walk * segs));
    const u = walk * segs - k;
    return { x: lerp(path[k].x, path[k + 1].x, u), y: lerp(path[k].y, path[k + 1].y, u) };
  })();
  const ef = t.step >= 4 ? [10, 20, 40, 80, 160, 320] : [];
  const rec = [0.78, 0.88, 0.94, 0.97, 0.985, 0.99];
  return (
    <>
      {t.step < 2 && (
        <div style={{ opacity: 1 - from(t, 2) }}>
          {["🛣️ highway → region", "🛤️ main road → town", "🏘️ local streets → the door"].map((s, i) => (
            <Abs key={s} x={460} y={300 + i * 170} w={1000} style={{ ...card([C.pink, C.amber, C.blue][i]), padding: "22px 34px", fontSize: 44, fontWeight: 800, ...rise(f, (t.step >= 1 ? at(t, 1) : 999) + i * 25) }}>
              {s}
            </Abs>
          ))}
          {t.step === 0 && (
            <Abs x={0} y={460} w={1920} style={{ textAlign: "center", ...rise(f, 6) }}>
              <Big size={64}>🚗 how do you drive across a country?</Big>
            </Abs>
          )}
        </div>
      )}
      {t.step >= 2 && (
        <div style={{ opacity: t.step >= 4 ? 0.35 : 1 }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {layers.map((l, li) => (
              <g key={li} opacity={shown(li)}>
                <rect x={240} y={l.y - 80} width={1440} height={160} rx={30} fill={`${l.col}10`} stroke={`${l.col}55`} strokeWidth={2} />
                {pts[li].slice(1).map((p, i) => (
                  <line key={i} x1={pts[li][i].x} y1={pts[li][i].y} x2={p.x} y2={p.y} stroke={l.col} strokeWidth={li === 0 ? 5 : 2} opacity={0.6} />
                ))}
                {pts[li].map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={li === 0 ? 14 : 10} fill={l.col} />
                ))}
                <text x={260} y={l.y - 52} fontSize={26} fontWeight={800} fill={l.col}>{l.name}</text>
              </g>
            ))}
            {walk > 0 && (
              <>
                <polyline points={path.slice(0, Math.floor(walk * segs) + 1).map((p) => `${p.x},${p.y}`).join(" ") + ` ${pos.x},${pos.y}`} fill="none" stroke={C.green} strokeWidth={7} strokeDasharray="14 8" />
                <circle cx={pos.x} cy={pos.y} r={20} fill={C.green} />
                {walk >= 1 && <text x={path[segs].x} y={path[segs].y + 56} textAnchor="middle" fontSize={30} fontWeight={800} fill={C.green}>nearest card ✓</text>}
              </>
            )}
          </svg>
        </div>
      )}
      {t.step >= 4 && (
        <Abs x={460} y={240} w={1000} style={{ ...card(C.green), padding: 30, ...rise(f, at(t, 4)) }}>
          <div style={{ fontSize: 30, fontWeight: 800 }}>candidates kept while searching → recall</div>
          <svg width={940} height={300} style={{ marginTop: 10 }}>
            {ef.map((e, i) => {
              const h = (rec[i] - 0.7) / 0.3 * 230 * ease(f, at(t, 4) + 20 + i * 8, 20);
              return (
                <g key={e}>
                  <rect x={30 + i * 150} y={260 - h} width={100} height={h} rx={10} fill={i === 2 ? C.green : C.card2} />
                  <text x={80 + i * 150} y={290} textAnchor="middle" fontSize={24} fill={C.muted}>{e}</text>
                  <text x={80 + i * 150} y={250 - h} textAnchor="middle" fontSize={24} fontWeight={800} fill={C.text}>{rec[i]}</text>
                </g>
              );
            })}
          </svg>
          <div style={{ fontSize: 26, color: C.muted }}>big gains first, then very little (illustrative)</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the post-filter bug

export const PostFilter = ({ t }: CP) => {
  const f = t.frame;
  const N = 40;
  const isBlr = (i: number) => i === 17;
  const filt = t.step >= 2 ? ease(f, at(t, 2) + 20, 40) : 0;
  return (
    <>
      {t.step === 0 && (
        <div style={{ opacity: during(t, 0) }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 600 }, (_, i) => (
              <circle key={i} cx={220 + (i % 40) * 37} cy={240 + Math.floor(i / 40) * 40} r={11} fill={i % 100 === 7 ? C.blue : PALETTE[(i % 5) + 1]} opacity={i % 100 === 7 ? 1 : 0.4} />
            ))}
          </svg>
          <Abs x={0} y={870} w={1920} style={{ textAlign: "center", fontSize: 38, fontWeight: 800 }}>
            40 franchises, one index · <span style={{ color: C.blue }}>Bengaluru-North = 1%</span>
          </Abs>
        </div>
      )}
      {t.step >= 1 && t.step < 4 && (
        <div style={{ opacity: 1 - from(t, 4) }}>
          <Abs x={0} y={170} w={1920} style={{ textAlign: "center", fontSize: 40, fontWeight: 800, ...rise(f, at(t, 1)) }}>the index's 40 best candidates, from every franchise</Abs>
          {Array.from({ length: N }, (_, i) => {
            const keep = isBlr(i) && false;
            const x = 260 + (i % 10) * 150;
            const y = 300 + Math.floor(i / 10) * 120;
            return (
              <div key={i} style={{ position: "absolute", left: x, top: y + filt * (keep ? 0 : 700) * (0.4 + rnd(i) * 0.6), width: 110, height: 80, borderRadius: 14, background: PALETTE[(i % 5) + 1], opacity: enter(f, at(t, 1) + i * 1.5, 8) * (1 - filt), transform: `rotate(${filt * (rnd(i) - 0.5) * 90}deg)` }} />
            );
          })}
          {t.step >= 2 && (
            <Abs x={360} y={480} w={1200} style={{ textAlign: "center", ...rise(f, at(t, 2) + 50) }}>
              <div style={{ ...card(C.red), padding: "26px 34px", display: "inline-block" }}>
                <div style={{ fontSize: 44, fontWeight: 900 }}>filter: franchise = blr-north</div>
                <div style={{ fontSize: 60, fontWeight: 900, color: C.red, marginTop: 8 }}>0 results</div>
              </div>
            </Abs>
          )}
        </div>
      )}
      {t.step >= 4 && (
        <div style={{ opacity: from(t, 4) }}>
          {["Pune-East", "Bengaluru-North", "Mumbai-West"].map((nm, i) => (
            <Abs key={nm} x={200 + i * 540} y={300} w={480} style={{ ...card(i === 1 ? C.blue : C.line), padding: 26, textAlign: "center", ...rise(f, at(t, 4) + i * 15) }}>
              <div style={{ fontSize: 34, fontWeight: 800 }}>{nm}</div>
              <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>its own index</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 }}>
                {Array.from({ length: 12 }, (_, k) => <div key={k} style={{ width: 26, height: 26, borderRadius: 6, background: i === 1 ? C.blue : PALETTE[i + 2] }} />)}
              </div>
            </Abs>
          ))}
          <Abs x={0} y={720} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 4) + 50) }}>
            <Chip color={C.green} style={{ fontSize: 32 }}>✓ the filter becomes free · or keep walking until 10 match</Chip>
          </Abs>
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ BM25 as a librarian

export const Bm25 = ({ t }: CP) => {
  const f = t.frame;
  const words: [string, number, string][] = [
    ["ERR_SLOT_EXPIRED", 0.98, "in 3 of 2,000,000 cards"],
    ["refund", 0.45, "in 6% of cards"],
    ["delivery", 0.08, "in half of all cards"],
  ];
  return (
    <>
      {t.step < 2 && (
        <div style={{ opacity: 1 - from(t, 2) }}>
          <Abs x={160} y={250} w={760} style={{ ...card(C.purple), padding: 30, ...rise(f, 6) }}>
            <div style={{ fontSize: 34, fontWeight: 800, color: C.purple }}>🗺️ meaning search</div>
            <div style={{ fontSize: 30, marginTop: 14 }}>“eggs broken, money back” ✓</div>
            <div style={{ fontSize: 30, marginTop: 8, color: C.red }}>“ERR_SLOT_EXPIRED” ✗ vague</div>
          </Abs>
          <Abs x={1000} y={250} w={760} style={{ ...card(C.blue), padding: 30, ...rise(f, (t.step >= 1 ? at(t, 1) : 999)) }}>
            <div style={{ fontSize: 34, fontWeight: 800, color: C.blue }}>🔤 keyword search</div>
            <div style={{ fontSize: 30, marginTop: 14, color: C.red }}>“eggs broken, money back” ✗</div>
            <div style={{ fontSize: 30, marginTop: 8 }}>“ERR_SLOT_EXPIRED” ✓ exact</div>
          </Abs>
          {t.step >= 1 && (
            <Abs x={0} y={620} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 1) + 40) }}>
              <Big size={60} color={C.green}>they fail in opposite places → run both</Big>
            </Abs>
          )}
        </div>
      )}
      {t.step >= 2 && (
        <div style={{ opacity: from(t, 2) }}>
          <Abs x={160} y={200} w={500} style={{ textAlign: "center", ...rise(f, at(t, 2)) }}>
            <div style={{ fontSize: 150 }}>🧑‍🏫</div>
            <div style={{ fontSize: 34, fontWeight: 800 }}>the librarian's questions</div>
          </Abs>
          <Abs x={720} y={220} w={1080} style={{ ...rise(f, at(t, 2) + 20) }}>
            {[
              ["How rare is the word?", t.step >= 3],
              ["How often is it in this card? (with diminishing returns)", t.step >= 4],
              ["Is the card just long?", t.step >= 4],
            ].map(([q, on], i) => (
              <div key={i} style={{ ...card(on ? C.amber : C.line), padding: "16px 26px", fontSize: 32, fontWeight: 700, marginBottom: 16, opacity: on ? 1 : 0.5 }}>{q as string}</div>
            ))}
          </Abs>
          {t.step >= 3 && (
            <Abs x={720} y={600} w={1080} style={{ ...rise(f, at(t, 3)) }}>
              {words.map(([w, wt, note], i) => (
                <div key={w} style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
                  <div style={{ width: 330, fontFamily: MONO, fontSize: 28, fontWeight: 700 }}>{w}</div>
                  <div style={{ height: 40, width: 420 * wt * ease(f, at(t, 3) + 20 + i * 15, 24), background: [C.green, C.amber, C.muted][i], borderRadius: 8 }} />
                  <div style={{ fontSize: 24, color: C.muted }}>{note}</div>
                </div>
              ))}
            </Abs>
          )}
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ RRF: merge by position

export const Rrf = ({ t }: CP) => {
  const f = t.frame;
  const kw = ["runbook-17", "faq-3"];
  const vs = ["faq-3", "incident-9", "runbook-17"];
  const fused: [string, string, number][] = [
    ["faq-3", "1/62 + 1/61", 0.0325],
    ["runbook-17", "1/61 + 1/63", 0.0323],
    ["incident-9", "1/62", 0.0161],
  ];
  const col = (id: string) => ({ "runbook-17": C.blue, "faq-3": C.green, "incident-9": C.pink })[id] ?? C.text;
  const merge = t.step >= 3 ? ease(f, at(t, 3), 40) : 0;
  const list = (title: string, items: string[], x: number, score: (i: number) => string) => (
    <Abs x={x} y={220} w={560} style={{ opacity: (1 - merge * 0.85) * enter(f, 6), transform: `translateX(${merge * (x < 900 ? 120 : -120)}px)` }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: C.muted, marginBottom: 14 }}>{title}</div>
      {items.map((id, i) => (
        <div key={id} style={{ ...card(col(id)), padding: "16px 22px", marginBottom: 14, display: "flex", justifyContent: "space-between", fontSize: 32, fontWeight: 700 }}>
          <span>{i + 1}. {id}</span>
          <span style={{ fontFamily: MONO, color: t.step >= 1 ? C.faint : C.muted, textDecoration: t.step >= 1 ? "line-through" : "none" }}>{score(i)}</span>
        </div>
      ))}
    </Abs>
  );
  return (
    <>
      {list("🔤 keyword (BM25)", kw, 200, (i) => ["14.2", "9.1"][i])}
      {list("🗺️ meaning", vs, 1160, (i) => ["0.83", "0.79", "0.71"][i])}
      {t.step === 0 && (
        <Abs x={0} y={760} w={1920} style={{ textAlign: "center", ...rise(f, 50) }}>
          <Big size={52} color={C.amber}>14.2 vs 0.83… different scales 🤔</Big>
        </Abs>
      )}
      {t.step >= 1 && t.step < 3 && (
        <Abs x={0} y={720} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 1)) }}>
          <Big size={54}>ignore scores · use positions</Big>
          {t.step >= 2 && <div style={{ fontFamily: MONO, fontSize: 44, color: C.amber, marginTop: 20, ...rise(f, at(t, 2)) }}>points = 1 / (60 + rank)</div>}
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={560} y={560} w={800} style={{ ...rise(f, at(t, 3) + 20) }}>
          {fused.map(([id, sum, s], i) => (
            <div key={id} style={{ ...card(col(id)), padding: "14px 22px", marginBottom: 12, display: "flex", justifyContent: "space-between", fontSize: 32, fontWeight: 800, opacity: enter(f, at(t, 3) + 30 + i * 12) }}>
              <span>{i + 1}. {id}</span>
              <span style={{ fontFamily: MONO, fontSize: 26, color: C.muted }}>{sum} = {s}</span>
            </div>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ reranking as hiring

export const Hiring = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      {t.step === 0 && (
        <div style={{ opacity: during(t, 0) }}>
          {["incident-9", "faq-3", "policy-2", "dairy rule ✓", "runbook-17"].map((s, i) => (
            <Abs key={s} x={560} y={240 + i * 110} w={800} style={{ ...card(i === 3 ? C.green : C.line), padding: "14px 26px", fontSize: 32, fontWeight: 700, ...rise(f, 10 + i * 8) }}>
              {i + 1}. {s}
            </Abs>
          ))}
          <Abs x={1400} y={600} w={440} style={{ fontSize: 34, fontWeight: 800, color: C.amber, ...rise(f, 60) }}>← the right one is 4th</Abs>
        </div>
      )}
      {t.step >= 1 && t.step < 4 && (
        <div style={{ opacity: from(t, 1) * (1 - from(t, 4)) }}>
          {/* the screen: a flood of CVs through a funnel */}
          {Array.from({ length: 50 }, (_, i) => {
            const p = clamp01(((f - at(t, 1) - i * 2) % 70) / 70);
            return <div key={i} style={{ position: "absolute", left: lerp(120 + rnd(i) * 500, 700, p), top: lerp(200 + rnd(i + 7) * 500, 520, p), width: 44, height: 56, borderRadius: 6, background: "#e8ecf3", opacity: f > at(t, 1) + i * 2 ? Math.sin(p * Math.PI) : 0 }} />;
          })}
          <Abs x={120} y={170} w={600} style={{ fontSize: 34, fontWeight: 800 }}>10,000 CVs · quick screen</Abs>
          <Abs x={760} y={420} w={340} style={{ ...card(t.step === 2 ? C.blue : C.line), padding: 22, textAlign: "center", fontSize: 30, fontWeight: 800 }}>
            ⚡ screen
            <div style={{ fontSize: 22, color: C.muted, fontWeight: 500 }}>question and card turned into numbers separately</div>
          </Abs>
          {t.step >= 3 && (
            <Abs x={1180} y={300} w={640} style={{ ...card(C.green), padding: 26, ...rise(f, at(t, 3)) }}>
              <div style={{ fontSize: 34, fontWeight: 800 }}>🧑‍⚖️ interview the top 20</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 18, fontSize: 28 }}>
                <span style={{ ...card(C.blue), padding: "8px 14px" }}>question</span>
                <span style={{ fontSize: 34 }}>+</span>
                <span style={{ ...card(C.amber), padding: "8px 14px" }}>one card</span>
                <span style={{ fontSize: 34 }}>→</span>
                <span style={{ fontFamily: MONO, color: C.green, fontWeight: 800 }}>0.94</span>
              </div>
              <div style={{ fontSize: 24, color: C.muted, marginTop: 14 }}>read together, word by word: slow, sharp</div>
            </Abs>
          )}
        </div>
      )}
      {t.step >= 4 && (
        <div style={{ opacity: from(t, 4) }}>
          <Abs x={200} y={300} w={720} style={{ ...card(C.blue), padding: 30, ...rise(f, at(t, 4)) }}>
            <div style={{ fontSize: 40, fontWeight: 800 }}>1 · search wide</div>
            <div style={{ fontSize: 30, color: C.muted, marginTop: 8 }}>goal: the right card is somewhere in the top 100</div>
          </Abs>
          <Abs x={1000} y={300} w={720} style={{ ...card(C.green), padding: 30, ...rise(f, at(t, 4) + 30) }}>
            <div style={{ fontSize: 40, fontWeight: 800 }}>2 · rerank</div>
            <div style={{ fontSize: 30, color: C.muted, marginTop: 8 }}>goal: it ends up first</div>
          </Abs>
          {t.step >= 5 && (
            <Abs x={200} y={560} w={1520} style={{ display: "flex", gap: 24, ...rise(f, at(t, 5)) }}>
              <Chip color={C.amber} style={{ fontSize: 30 }}>below a minimum score → “I found nothing”</Chip>
              <Chip color={C.purple} style={{ fontSize: 30 }}>skip near-duplicates</Chip>
            </Abs>
          )}
        </div>
      )}
    </>
  );
};
