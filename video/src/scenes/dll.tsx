// DeepLogLens lecture (LL-01) pictures, drawn as boxes: a Kafka record's
// anatomy, the splitter's byte ranges fanning out to partitions, a table's
// structure, the content-fingerprint upsert, the three crash points, the eval
// grid (precision / recall / F1) and Reciprocal Rank Fusion worked by hand.
import type { ReactNode } from "react";
import { C, MONO } from "../lib/theme.ts";
import { enter, lerp, ease, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at } from "./custom3.tsx";
import type { CP } from "./secui.tsx";

const Title = ({ text, f, sub }: { text: string; f: number; sub?: string }) => (
  <Abs x={80} y={124} w={1760} style={rise(f, 2)}>
    <div style={{ fontFamily: C.head, fontSize: text.length > 52 ? 36 : text.length > 40 ? 40 : 46, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15 }}>{text}</div>
    {sub && <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>{sub}</div>}
  </Abs>
);

const Mono = ({ children, color, size = 24, weight = 600 }: { children: ReactNode; color?: string; size?: number; weight?: number }) => (
  <span style={{ fontFamily: MONO, fontSize: size, color: color ?? C.text, fontWeight: weight }}>{children}</span>
);

const Small = ({ children, color }: { children: ReactNode; color?: string }) => (
  <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: color ?? C.muted }}>{children}</div>
);

// ------------------------------------------------------------------ a Kafka record

// Beat 0 shows the envelope (topic, key, partition) and the intro; beat i shows
// value field i - 1 with its note; a last beat shows the footer.
export const DllMsg = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { title: string; topic: string; key: string; part: string; intro: string; fields: { k: string; v: string; note: string }[]; foot?: string };
  const n = p.fields.length;
  const cur = t.step >= 1 && t.step <= n ? t.step - 1 : -1;
  const rh = Math.min(54, Math.floor(360 / n));
  const head = [
    { k: "topic", v: p.topic },
    { k: "key", v: p.key },
    { k: "partition", v: p.part },
  ];
  const panel = cur >= 0 ? p.fields[cur] : null;
  return (
    <>
      <Title text={p.title} f={f} />
      <Abs x={80} y={226} w={1010} h={664} style={{ ...card(C.blue), padding: "22px 30px", boxSizing: "border-box", ...rise(f, 4, 20) }}>
        <Small color={C.blue}>Kafka record</Small>
        {head.map((h, i) => (
          <div key={h.k} style={{ display: "flex", gap: 18, alignItems: "baseline", marginTop: i ? 8 : 14 }}>
            <div style={{ width: 150, flex: "none", fontSize: 20, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted }}>{h.k}</div>
            <Mono size={h.v.length > 40 ? 21 : 24} color={i === 0 ? C.text : C.blue}>
              {h.v}
            </Mono>
          </div>
        ))}
        <div style={{ height: 2, background: C.line, margin: "18px 0 12px" }} />
        <Small>value · JSON</Small>
        <div style={{ marginTop: 8 }}>
          <Mono size={22} color={C.faint}>
            {"{"}
          </Mono>
          {p.fields.map((fl, i) => {
            if (t.step < i + 1) return null;
            const on = i === cur;
            return (
              <div key={fl.k} style={{ height: rh, display: "flex", alignItems: "center", paddingLeft: 26, borderRadius: 10, background: on ? C.soft : "transparent", borderLeft: `4px solid ${on ? C.blue : "transparent"}`, opacity: enter(f, at(t, i + 1), 10) }}>
                <Mono size={rh < 44 ? 21 : 23} color={on ? C.blue : C.muted}>
                  "{fl.k}"
                </Mono>
                <Mono size={rh < 44 ? 21 : 23} color={C.faint}>
                  :&nbsp;
                </Mono>
                <Mono size={rh < 44 ? 21 : 23}>{fl.v}</Mono>
              </div>
            );
          })}
          {t.step >= n && (
            <Mono size={22} color={C.faint}>
              {"}"}
            </Mono>
          )}
        </div>
      </Abs>
      <Abs x={1130} y={226} w={710} h={664} style={{ ...card(panel ? C.blue : undefined), padding: "30px 34px", boxSizing: "border-box", ...rise(f, 8, 20) }}>
        {t.step === 0 && (
          <div style={rise(f, 8)}>
            <Small color={C.blue}>What you're looking at</Small>
            <div style={{ fontSize: 30, lineHeight: 1.42, fontWeight: 600, marginTop: 16 }}>{p.intro}</div>
          </div>
        )}
        {panel && (
          <div key={cur} style={rise(f, at(t, cur + 1), 16)}>
            <Small>field {cur + 1} of {n}</Small>
            <div style={{ fontFamily: MONO, fontSize: panel.k.length > 14 ? 34 : 40, fontWeight: 800, color: C.blue, marginTop: 12, overflowWrap: "anywhere" }}>{panel.k}</div>
            <div style={{ fontFamily: MONO, fontSize: 24, color: C.muted, marginTop: 6, overflowWrap: "anywhere" }}>{panel.v}</div>
            <div style={{ fontSize: panel.note.length > 150 ? 27 : 30, lineHeight: 1.42, fontWeight: 600, marginTop: 22 }}>{panel.note}</div>
          </div>
        )}
        {t.step > n && p.foot && (
          <div style={rise(f, at(t, n + 1), 16)}>
            <Small color={C.green}>The whole message</Small>
            <div style={{ fontSize: 32, lineHeight: 1.42, fontWeight: 700, marginTop: 16 }}>{p.foot}</div>
          </div>
        )}
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ byte ranges → partitions

// 0 the file; 1 minute boundaries; 2 cuts and parts; 3 one pointer per part
// into a partition; 4 consumer threads own partitions; 5 footer.
export const DllBytes = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { title: string; file: string; size: string; cuts: number[]; labels: string[]; map: number[]; lanes?: number; threads?: number; foot?: string };
  const s = t.step;
  const X = 100;
  const Wd = 1720;
  const Y = 250;
  const lanes = p.lanes ?? 6;
  const threads = p.threads ?? 3;
  const parts = p.cuts.length - 1;
  // deterministic, slightly uneven minute boundaries
  const ticks: number[] = [];
  let x = 0;
  for (let i = 0; x < 1; i++) {
    x += 0.014 + 0.012 * ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) * 0.5;
    if (x < 1) ticks.push(x);
  }
  // a cut always lands on a minute boundary: snap each inner cut to the next tick
  const cuts = p.cuts.map((c, i) => (i === 0 || i === p.cuts.length - 1 ? c : ticks.find((tk) => tk >= c) ?? c));
  const laneW = (Wd - (lanes - 1) * 20) / lanes;
  const laneX = (i: number) => X + i * (laneW + 20);
  const LY = 520;
  const TY = 740;
  return (
    <>
      <Title text={p.title} f={f} />
      <Abs x={X} y={Y - 44} w={Wd} style={{ display: "flex", justifyContent: "space-between", ...rise(f, 4) }}>
        <Mono size={24}>{p.file}</Mono>
        <Mono size={22} color={C.muted}>
          one object in blob storage · read once, never copied
        </Mono>
      </Abs>
      <Abs x={X} y={Y} w={Wd} h={80} style={{ ...card(), borderRadius: 14, overflow: "hidden", ...rise(f, 6, 14) }}>
        {s >= 1 &&
          ticks.map((tk, i) => (
            <div key={i} style={{ position: "absolute", left: `${tk * 100}%`, top: 0, bottom: 0, width: 2, background: C.line, opacity: enter(f, at(t, 1) + i * 0.6, 8) }} />
          ))}
        {s >= 2 &&
          cuts.slice(0, -1).map((c, i) => (
            <div key={i} style={{ position: "absolute", left: `${c * 100}%`, width: `${(cuts[i + 1] - c) * 100}%`, top: 0, bottom: 0, background: i % 2 ? `${C.blue}30` : `${C.amber}26`, borderRight: `4px solid ${C.blue}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: enter(f, at(t, 2) + i * 5, 10) }}>
              <Mono size={22} weight={800}>
                part {i}
              </Mono>
            </div>
          ))}
      </Abs>
      <Abs x={X} y={Y + 88} w={Wd} style={{ display: "flex", justifyContent: "space-between", ...rise(f, 6) }}>
        <Mono size={20} color={C.faint}>
          byte 0
        </Mono>
        <Mono size={20} color={C.faint}>
          byte {p.size}
        </Mono>
      </Abs>
      {s === 1 && (
        <Abs x={X} y={Y + 140} w={Wd} style={{ textAlign: "center", fontSize: 28, fontWeight: 650, color: C.muted, ...rise(f, at(t, 1)) }}>
          each grey line: a byte offset where a new minute starts (a line with a timestamp in the next minute)
        </Abs>
      )}
      {s >= 2 &&
        p.labels.map((l, i) => {
          const cx = ((cuts[i] + cuts[i + 1]) / 2) * Wd + X;
          return (
            <Abs key={i} x={cx - 140} y={Y + 128 + (i % 2) * 40} w={280} style={{ textAlign: "center", opacity: enter(f, at(t, 2) + i * 5, 10) }}>
              <Mono size={19} color={C.blue}>
                {l}
              </Mono>
            </Abs>
          );
        })}
      {s >= 3 &&
        Array.from({ length: lanes }, (_, i) => (
          <Abs key={i} x={laneX(i)} y={LY} w={laneW} h={150} style={{ ...card(), padding: "12px 16px", boxSizing: "border-box", opacity: enter(f, at(t, 3), 12) }}>
            <Mono size={22} weight={800}>
              P{i}
            </Mono>
            <div style={{ fontSize: 17, color: C.muted }}>log.ingest.parts</div>
          </Abs>
        ))}
      {s >= 3 &&
        Array.from({ length: parts }, (_, i) => {
          const lane = p.map[i] % lanes;
          const sx = ((cuts[i] + cuts[i + 1]) / 2) * Wd + X - 70;
          const sy = Y + 20;
          const before = p.map.slice(0, i).filter((m) => m % lanes === lane).length;
          const tx = laneX(lane) + 18 + (before % 2) * 120;
          const ty = LY + 66 + Math.floor(before / 2) * 38;
          const k = ease(f, at(t, 3) + 10 + i * 9, 26);
          return (
            <Abs key={i} x={lerp(sx, tx, k)} y={lerp(sy, ty, k)} w={110} h={32} style={{ borderRadius: 8, background: C.card2, border: `2px solid ${C.blue}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: enter(f, at(t, 3) + 10 + i * 9, 6) }}>
              <Mono size={17} weight={800}>
                ✉ part {i}
              </Mono>
            </Abs>
          );
        })}
      {s >= 4 &&
        Array.from({ length: threads }, (_, i) => {
          const per = lanes / threads;
          const x0 = laneX(i * per);
          const x1 = laneX((i + 1) * per - 1) + laneW;
          return (
            <Abs key={i} x={x0} y={TY} w={x1 - x0} h={96} style={{ ...card(C.green), display: "flex", alignItems: "center", justifyContent: "center", gap: 14, ...rise(f, at(t, 4) + i * 6, 16) }}>
              <span style={{ fontSize: 30 }}>⚙</span>
              <span style={{ fontSize: 26, fontWeight: 750 }}>
                consumer thread {i + 1}
                <span style={{ color: C.muted, fontWeight: 600 }}>
                  {" "}
                  · owns {Array.from({ length: per }, (_, j) => `P${i * per + j}`).join(", ")}
                </span>
              </span>
            </Abs>
          );
        })}
      {s >= 4 &&
        Array.from({ length: lanes }, (_, i) => (
          <Abs key={i} x={laneX(i) + laneW / 2 - 2} y={LY + 150} w={4} h={TY - LY - 150} style={{ background: C.green, opacity: 0.7 * enter(f, at(t, 4) + 4, 10) }} />
        ))}
      {s >= 5 && p.foot && (
        <Abs x={X} y={864} w={Wd} style={{ display: "flex", justifyContent: "center", ...rise(f, at(t, 5)) }}>
          <Chip color={C.blue}>
            <span style={{ fontSize: 26 }}>{p.foot}</span>
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ a table's structure

// Beat 0 names the table; beat i shows column i - 1 and its note; then an
// example row (if any), then the footer (if any).
export const DllTable = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { title: string; name: string; sub?: string; cols: { n: string; t: string; k?: string; note: string }[]; sample?: { c: string; v: string }[]; foot?: string };
  const n = p.cols.length;
  const cur = t.step >= 1 && t.step <= n ? t.step - 1 : -1;
  const sampleStep = p.sample ? n + 1 : -1;
  const footStep = p.foot ? n + 1 + (p.sample ? 1 : 0) : -1;
  const rh = Math.min(64, Math.floor(560 / n));
  const H = 96 + rh * n + 24;
  const showSample = p.sample && t.step >= sampleStep && (footStep < 0 || t.step < footStep || true);
  const kTone = (k?: string) => (k === "PK" ? C.blue : k === "FK" ? C.purple : k === "GEN" || k === "✓" ? C.green : k === "✗" ? C.red : C.amber);
  return (
    <>
      <Title text={p.title} f={f} />
      <Abs x={80} y={222} w={1060} h={H} style={{ ...card(), overflow: "hidden", ...rise(f, 4, 20) }}>
        <div style={{ height: 84, display: "flex", alignItems: "center", gap: 18, padding: "0 30px", background: C.card2, borderBottom: `2px solid ${C.line}` }}>
          <span style={{ fontSize: 28 }}>🗄</span>
          <Mono size={p.name.length > 30 ? 26 : 30} color={C.blue} weight={800}>
            {p.name}
          </Mono>
          {p.sub && <span style={{ fontSize: 21, color: C.muted, marginLeft: "auto" }}>{p.sub}</span>}
        </div>
        <div style={{ padding: "12px 0" }}>
          {p.cols.map((c, i) => {
            if (t.step < i + 1) return null;
            const on = i === cur;
            return (
              <div key={c.n} style={{ height: rh, display: "flex", alignItems: "center", padding: "0 30px", background: on ? C.soft : "transparent", borderLeft: `5px solid ${on ? C.blue : "transparent"}`, opacity: enter(f, at(t, i + 1), 10) }}>
                <div style={{ width: 360, flex: "none" }}>
                  <Mono size={rh < 50 ? 22 : 25} weight={800}>
                    {c.n}
                  </Mono>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Mono size={rh < 50 ? 19 : 21} color={C.muted}>
                    {c.t}
                  </Mono>
                </div>
                {c.k && (
                  <div style={{ flex: "none", padding: "3px 12px", borderRadius: 8, border: `2px solid ${kTone(c.k)}`, color: kTone(c.k), fontSize: 17, fontWeight: 800, letterSpacing: 1 }}>{c.k}</div>
                )}
              </div>
            );
          })}
        </div>
      </Abs>
      <Abs x={1180} y={222} w={660} h={Math.max(H, 420)} style={{ ...card(cur >= 0 ? C.blue : undefined), padding: "28px 32px", boxSizing: "border-box", ...rise(f, 8, 20) }}>
        {t.step === 0 && (
          <div style={rise(f, 8)}>
            <Small color={C.blue}>The table</Small>
            <div style={{ fontSize: 30, lineHeight: 1.42, fontWeight: 600, marginTop: 14 }}>One row per column follows. Watch the key: it decides what a duplicate is.</div>
          </div>
        )}
        {cur >= 0 && (
          <div key={cur} style={rise(f, at(t, cur + 1), 14)}>
            <Small>column {cur + 1} of {n}</Small>
            <div style={{ fontFamily: MONO, fontSize: p.cols[cur].n.length > 14 ? 32 : 38, fontWeight: 800, color: C.blue, marginTop: 10, overflowWrap: "anywhere" }}>{p.cols[cur].n}</div>
            <div style={{ fontFamily: MONO, fontSize: 21, color: C.muted, marginTop: 6, overflowWrap: "anywhere" }}>{p.cols[cur].t}</div>
            <div style={{ fontSize: p.cols[cur].note.length > 140 ? 26 : 29, lineHeight: 1.42, fontWeight: 600, marginTop: 18 }}>{p.cols[cur].note}</div>
          </div>
        )}
        {cur < 0 && t.step > 0 && showSample && p.sample && (
          <div style={rise(f, at(t, sampleStep), 14)}>
            <Small color={C.green}>One real row</Small>
            <div style={{ marginTop: 12 }}>
              {p.sample.map((r) => (
                <div key={r.c} style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "baseline" }}>
                  <div style={{ width: 190, flex: "none" }}>
                    <Mono size={19} color={C.muted}>
                      {r.c}
                    </Mono>
                  </div>
                  <Mono size={20}>{r.v}</Mono>
                </div>
              ))}
            </div>
          </div>
        )}
        {cur < 0 && t.step > 0 && p.foot && t.step >= footStep && (
          <div style={{ fontSize: p.sample ? 25 : 30, lineHeight: 1.4, fontWeight: 700, marginTop: p.sample ? 22 : 0, paddingTop: p.sample ? 18 : 0, borderTop: p.sample ? `2px solid ${C.line}` : "none", color: p.sample ? C.green : C.text, ...rise(f, at(t, footStep), 14) }}>{p.foot}</div>
        )}
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ the fingerprint upsert

// 0 a chunk; 1 its SHA-256 key; 2 first delivery inserts, RETURNING one id;
// 3 only returned chunks add their counts; 4 a redelivery: same key, conflict,
// nothing returned, counts unchanged; 5 the rule.
export const DllFp = ({ t }: CP) => {
  const f = t.frame;
  const s = t.step;
  const KEY = "9f2c41d7…e41a";
  const count = s < 3 ? 0 : Math.round(212 * ease(f, at(t, 3) + 8, 30));
  const sqlLines = ["INSERT INTO log_chunks_s_7f3a…", "  (chunk_id, document_id,", "   line_start, line_end, content)", `VALUES ('${KEY}', …)`, "ON CONFLICT (chunk_id) DO NOTHING", "RETURNING chunk_id;"];
  return (
    <>
      <Title text="The content fingerprint makes the insert idempotent" f={f} />
      {/* the chunk */}
      <Abs x={80} y={222} w={560} h={262} style={{ ...card(), padding: "20px 24px", boxSizing: "border-box", ...rise(f, 4, 18) }}>
        <Small color={C.blue}>one chunk · 60 s window</Small>
        <div style={{ fontSize: 22, color: C.muted, marginTop: 6 }}>09:31 · lines 3,401–4,610</div>
        <div style={{ fontFamily: MONO, fontSize: 17, lineHeight: 1.6, marginTop: 12, color: C.text }}>
          <div>09:31:02 ERROR [pay] HTTP 503 /checkout</div>
          <div>09:31:02 WARN [db] pool wait 4.1s</div>
          <div style={{ color: C.faint }}>… 1,208 more lines …</div>
        </div>
      </Abs>
      {s >= 1 && (
        <Abs x={80} y={506} w={560} style={rise(f, at(t, 1), 16)}>
          <div style={{ fontFamily: MONO, fontSize: 18, color: C.muted, textAlign: "center", whiteSpace: "nowrap" }}>SHA-256(document_id || line_start || content)</div>
          <div style={{ textAlign: "center", fontSize: 34, color: C.blue, margin: "4px 0" }}>↓</div>
          <div style={{ ...card(C.blue), padding: "14px 20px", textAlign: "center" }}>
            <Small>chunk_id · primary key</Small>
            <Mono size={30} color={C.blue} weight={800}>
              {KEY}
            </Mono>
            <div style={{ fontSize: 18, color: C.muted, marginTop: 4 }}>64 hex chars · same bytes in → same key out</div>
          </div>
        </Abs>
      )}
      {/* the SQL */}
      {s >= 2 && (
        <Abs x={690} y={222} w={600} h={300} style={{ ...card(s === 4 ? C.amber : C.blue), padding: "18px 22px", boxSizing: "border-box", ...rise(f, at(t, 2), 18) }}>
          <Small color={s >= 4 ? C.amber : C.blue}>{s >= 4 ? "redelivery · same bytes" : "first delivery"}</Small>
          <div style={{ fontFamily: MONO, fontSize: 19, lineHeight: 1.55, marginTop: 8 }}>
            {sqlLines.map((l, i) => (
              <div key={i} style={{ color: i >= 4 ? C.blue : C.text, fontWeight: i >= 4 ? 800 : 500 }}>
                {l}
              </div>
            ))}
          </div>
        </Abs>
      )}
      {s >= 2 && (
        <Abs x={690} y={540} w={600} style={{ ...card(s >= 4 ? C.amber : C.green), padding: "16px 22px", ...rise(f, at(t, s >= 4 ? 4 : 2) + 12, 14) }}>
          {s < 4 ? (
            <>
              <Small color={C.green}>RETURNING</Small>
              <Mono size={24} color={C.green}>
                ['{KEY}']
              </Mono>
              <div style={{ fontSize: 21, color: C.muted, marginTop: 4 }}>1 new row: this chunk was never stored before</div>
            </>
          ) : (
            <>
              <Small color={C.amber}>conflict on chunk_id → DO NOTHING · RETURNING</Small>
              <Mono size={26} color={C.amber}>
                [ ]
              </Mono>
              <div style={{ fontSize: 21, color: C.muted, marginTop: 4 }}>no new rows, so nothing is added below</div>
            </>
          )}
        </Abs>
      )}
      {/* the tables */}
      {s >= 2 && (
        <Abs x={1330} y={222} w={510} style={{ ...card(), padding: "16px 20px", ...rise(f, at(t, 2) + 16, 16) }}>
          <Small>chunk table</Small>
          <div style={{ fontFamily: MONO, fontSize: 18, color: C.muted, marginTop: 8 }}>chunk_id · bucket · lines</div>
          <div style={{ fontFamily: MONO, fontSize: 19, marginTop: 6, padding: "6px 8px", borderRadius: 8, background: C.soft }}>{KEY} · 09:31 · 3401–4610</div>
          <div style={{ fontSize: 19, color: s >= 4 ? C.amber : C.muted, marginTop: 8 }}>{s >= 4 ? "still exactly 1 row" : "1 row"}</div>
        </Abs>
      )}
      {s >= 3 && (
        <Abs x={1330} y={440} w={510} style={{ ...card(s === 3 ? C.green : undefined), padding: "16px 20px", ...rise(f, at(t, 3), 16) }}>
          <Small>log_metrics</Small>
          <div style={{ fontFamily: MONO, fontSize: 18, color: C.muted, marginTop: 8 }}>09:31 · API · api_5xx</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 6 }}>
            <Mono size={20} color={C.muted}>
              count =
            </Mono>
            <Mono size={44} color={C.green} weight={800}>
              {count}
            </Mono>
          </div>
          <div style={{ fontSize: 19, color: s >= 4 ? C.amber : C.muted, marginTop: 4 }}>{s >= 4 ? "unchanged: 212, not 424" : "added only for the returned chunk ids"}</div>
        </Abs>
      )}
      {s >= 5 && (
        <Abs x={80} y={806} w={1760} style={{ display: "flex", justifyContent: "center", ...rise(f, at(t, 5)) }}>
          <div style={{ ...card(C.blue), padding: "18px 40px", fontSize: 34, fontWeight: 800 }}>same bytes → same key → same row → counted once</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ crash points

// 0 the consumer's timeline; beat i (1..n) shows crash i and its outcome; a
// last beat shows the footer.
export const DllCrash = ({ t, props }: CP) => {
  const f = t.frame;
  const p = props as { title: string; boxes: string[]; crashes: { gap: number; label: string; outcome: string }[]; foot?: string };
  const n = p.crashes.length;
  const bw = 300;
  const gap = (1720 - p.boxes.length * bw) / (p.boxes.length - 1);
  const bx = (i: number) => 100 + i * (bw + gap);
  const Y = 230;
  return (
    <>
      <Title text={p.title} f={f} />
      {p.boxes.map((b, i) => (
        <Abs key={i} x={bx(i)} y={Y} w={bw} h={110} style={{ ...card(i === 2 ? C.green : undefined), display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 16px", boxSizing: "border-box", fontSize: 24, fontWeight: 700, lineHeight: 1.25, opacity: enter(f, 4 + i * 6, 12) }}>
          {b}
        </Abs>
      ))}
      {p.boxes.slice(0, -1).map((_, i) => (
        <Abs key={i} x={bx(i) + bw + 4} y={Y + 40} w={gap - 8} style={{ textAlign: "center", fontSize: 30, color: C.faint, opacity: enter(f, 8 + i * 6, 10) }}>
          →
        </Abs>
      ))}
      {p.crashes.map((c, i) => {
        if (t.step < i + 1) return null;
        const cx = bx(c.gap) + bw + gap / 2;
        const on = t.step === i + 1;
        return (
          <div key={i}>
            <Abs x={cx - 30} y={Y + 118} w={60} style={{ textAlign: "center", fontSize: 40, color: C.red, ...rise(f, at(t, i + 1), 10) }}>
              ⚡
            </Abs>
            <Abs x={cx - 30} y={Y + 166} w={60} style={{ textAlign: "center", fontSize: 26, fontWeight: 900, color: C.red, ...rise(f, at(t, i + 1), 10) }}>
              {"ABC"[i]}
            </Abs>
            <Abs x={100} y={440 + i * 132} w={1720} h={116} style={{ ...card(on ? C.red : undefined), display: "flex", alignItems: "center", gap: 28, padding: "0 30px", boxSizing: "border-box", opacity: on || t.step > n ? 1 : 0.6, ...rise(f, at(t, i + 1) + 6, 16) }}>
              <div style={{ width: 380, flex: "none", fontSize: 25, fontWeight: 800, color: C.red }}>
                ⚡{"ABC"[i]} · {c.label}
              </div>
              <div style={{ fontSize: c.outcome.length > 120 ? 23 : 26, lineHeight: 1.35, fontWeight: 600 }}>{c.outcome}</div>
            </Abs>
          </div>
        );
      })}
      {t.step > n && p.foot && (
        <Abs x={100} y={440 + n * 132 + 8} w={1720} style={{ display: "flex", justifyContent: "center", ...rise(f, at(t, n + 1)) }}>
          <Chip color={C.green}>
            <span style={{ fontSize: 27 }}>{p.foot}</span>
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ eval grid

// 30 windows. 0 the windows; 1 gold (injected incident) windows; 2 what the
// gate flagged; 3 TP / FP / FN / TN; 4 precision; 5 recall; 6 F1; 7 incident
// recall and the call reduction.
export const DllEval = ({ t }: CP) => {
  const f = t.frame;
  const s = t.step;
  const gold = new Set([4, 5, 6, 7, 8, 16, 17, 18, 19, 26]);
  const flag = new Set([5, 6, 7, 8, 12, 17, 18, 22, 26]);
  const cw = 150;
  const ch = 82;
  const gx = 14;
  const x0 = (1920 - (10 * cw + 9 * gx)) / 2;
  const cls = (i: number) => (gold.has(i) && flag.has(i) ? "TP" : flag.has(i) ? "FP" : gold.has(i) ? "FN" : "TN");
  const col = { TP: C.green, FP: C.red, FN: C.purple, TN: C.line } as Record<string, string>;
  const counts = { TP: 7, FP: 2, FN: 3, TN: 18 } as Record<string, number>;
  const Formula = ({ i, x, name, expr, val }: { i: number; x: number; name: string; expr: string; val: string }) =>
    s >= i ? (
      <Abs x={x} y={590} w={540} h={190} style={{ ...card(s === i ? C.blue : undefined), padding: "18px 26px", boxSizing: "border-box", ...rise(f, at(t, i), 16) }}>
        <Small color={C.blue}>{name}</Small>
        <div style={{ fontFamily: MONO, fontSize: 24, color: C.muted, marginTop: 10 }}>{expr}</div>
        <div style={{ fontFamily: MONO, fontSize: 52, fontWeight: 800, marginTop: 6 }}>{val}</div>
      </Abs>
    ) : null;
  return (
    <>
      <Title text="Scoring the gate: 30 one-minute windows" f={f} />
      {Array.from({ length: 30 }, (_, i) => {
        const r = Math.floor(i / 10);
        const c = i % 10;
        const k = cls(i);
        const g = s >= 1 && gold.has(i);
        const fl = s >= 2 && flag.has(i);
        const colored = s >= 3;
        return (
          <Abs key={i} x={x0 + c * (cw + gx)} y={224 + r * (ch + 14)} w={cw} h={ch} style={{ borderRadius: 14, background: colored ? `${col[k]}${k === "TN" ? "55" : "33"}` : C.card, border: `3px solid ${colored ? col[k] : g ? C.purple : C.line}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: enter(f, 4 + i * 0.8, 10), boxSizing: "border-box" }}>
            <Mono size={19} color={C.muted}>
              10:{String(i).padStart(2, "0")}
            </Mono>
            <div style={{ fontSize: 22, fontWeight: 800, height: 28, color: colored ? col[k] : C.blue }}>{colored ? (k === "TN" ? "" : k) : fl ? "⚑ flagged" : ""}</div>
          </Abs>
        );
      })}
      {s >= 1 && s < 3 && (
        <Abs x={x0} y={524} w={1600} style={{ display: "flex", gap: 30, fontSize: 24, fontWeight: 650, ...rise(f, at(t, 1)) }}>
          <span style={{ color: C.purple }}>▢ gold: an injected incident covers this minute (10)</span>
          {s >= 2 && <span style={{ color: C.blue, ...rise(f, at(t, 2)) }}>⚑ the gate sent it to the LLM (9)</span>}
        </Abs>
      )}
      {s >= 3 && (
        <Abs x={x0} y={524} w={1640} style={{ display: "flex", gap: 34, fontSize: 24, fontWeight: 750, ...rise(f, at(t, 3)) }}>
          {(["TP", "FP", "FN", "TN"] as const).map((k) => (
            <span key={k} style={{ color: k === "TN" ? C.muted : col[k] }}>
              {k} = {counts[k]} {k === "TP" ? "(flagged, real)" : k === "FP" ? "(flagged, not real)" : k === "FN" ? "(real, missed)" : "(quiet, left alone)"}
            </span>
          ))}
        </Abs>
      )}
      <Formula i={4} x={x0} name="precision" expr="TP / (TP + FP) = 7 / 9" val="0.78" />
      <Formula i={5} x={x0 + 566} name="recall" expr="TP / (TP + FN) = 7 / 10" val="0.70" />
      <Formula i={6} x={x0 + 1132} name="F1" expr="2PR / (P + R)" val="0.74" />
      {s >= 7 && (
        <Abs x={x0} y={806} w={1640} style={{ display: "flex", gap: 24, ...rise(f, at(t, 7)) }}>
          <Chip color={C.green}>
            <span style={{ fontSize: 24 }}>incident recall: 3 of 3 incidents had a flagged minute = 1.0</span>
          </Chip>
          <Chip color={C.blue}>
            <span style={{ fontSize: 24 }}>9 of 30 windows to the LLM → 70% fewer calls</span>
          </Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ RRF by hand

// 0 the two ranked lists; 1 the formula; 2 chunk A; 3 chunk C; 4 chunk B;
// 5 the fused order.
export const DllRrf = ({ t }: CP) => {
  const f = t.frame;
  const s = t.step;
  const vec = ["A", "C", "D", "E", "F"];
  const fts = ["B", "G", "H", "A", "C"];
  const desc: Record<string, string> = { A: "09:31 checkout 503s", B: "09:30 'status=503'", C: "09:32 pool exhausted", D: "09:12 slow login", E: "08:55 GC pause", F: "09:40 retry storm", G: "09:29 upstream 503", H: "09:33 503 to client" };
  const hi = s === 2 ? "A" : s === 3 ? "C" : s === 4 ? "B" : "";
  const List = ({ x, name, items, start }: { x: number; name: string; items: string[]; start: number }) => (
    <Abs x={x} y={222} w={440} style={{ ...card(), padding: "18px 22px", ...rise(f, start, 18) }}>
      <Small color={C.blue}>{name}</Small>
      {items.map((c, i) => (
        <div key={c} style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10, padding: "6px 10px", borderRadius: 10, background: hi === c ? C.soft : "transparent", border: `2px solid ${hi === c ? C.blue : "transparent"}` }}>
          <Mono size={20} color={C.muted}>
            rank {i}
          </Mono>
          <Mono size={26} weight={800} color={hi === c ? C.blue : C.text}>
            {c}
          </Mono>
          <span style={{ fontSize: 18, color: C.muted }}>{desc[c]}</span>
        </div>
      ))}
    </Abs>
  );
  const calc = [
    { step: 2, c: "A", expr: "1/(60+0) + 1/(60+3)", v: "0.0325", note: "1st in vector, 4th in full text" },
    { step: 3, c: "C", expr: "1/(60+1) + 1/(60+4)", v: "0.0320", note: "2nd and 5th: agreement again" },
    { step: 4, c: "B", expr: "1/(60+0)", v: "0.0167", note: "top of one list only" },
  ];
  const fused = [
    ["A", "0.0325"],
    ["C", "0.0320"],
    ["B", "0.0167"],
    ["G", "0.0164"],
    ["D", "0.0161"],
  ];
  return (
    <>
      <Title text="Reciprocal Rank Fusion, worked by hand (k = 60)" f={f} />
      <List x={80} name="vector leg · cosine, HNSW" items={vec} start={4} />
      <List x={1400} name="full-text leg · GIN, ts_rank" items={fts} start={10} />
      {s >= 1 && (
        <Abs x={560} y={222} w={800} style={{ ...card(C.blue), padding: "16px 24px", textAlign: "center", ...rise(f, at(t, 1), 16) }}>
          <Mono size={30} weight={800}>
            score(chunk) = Σ 1 / (60 + rank)
          </Mono>
          <div style={{ fontSize: 21, color: C.muted, marginTop: 6 }}>ranks only, never raw scores: cosine and ts_rank are different units</div>
        </Abs>
      )}
      {calc.map((c, i) =>
        s >= c.step ? (
          <Abs key={c.c} x={560} y={366 + i * 112} w={800} h={98} style={{ ...card(s === c.step ? C.blue : undefined), padding: "0 24px", display: "flex", alignItems: "center", gap: 22, boxSizing: "border-box", ...rise(f, at(t, c.step), 14) }}>
            <Mono size={34} weight={800} color={C.blue}>
              {c.c}
            </Mono>
            <div style={{ flex: 1 }}>
              <Mono size={23}>{c.expr}</Mono>
              <div style={{ fontSize: 19, color: C.muted }}>{c.note}</div>
            </div>
            <Mono size={34} weight={800} color={C.green}>
              {c.v}
            </Mono>
          </Abs>
        ) : null,
      )}
      {s >= 5 && (
        <Abs x={560} y={714} w={800} style={{ ...card(C.green), padding: "14px 24px", ...rise(f, at(t, 5), 16) }}>
          <Small color={C.green}>fused top 5 · what the grader reads</Small>
          <div style={{ display: "flex", gap: 22, marginTop: 8, flexWrap: "wrap" }}>
            {fused.map(([c, v], i) => (
              <span key={c} style={{ opacity: enter(f, at(t, 5) + i * 5, 8) }}>
                <Mono size={26} weight={800}>
                  {c}
                </Mono>
                <Mono size={20} color={C.muted}>
                  {" "}
                  {v}
                </Mono>
              </span>
            ))}
          </div>
        </Abs>
      )}
    </>
  );
};
