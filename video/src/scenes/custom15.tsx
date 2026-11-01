// Java Part 1 scenes (collections and HashMap internals): a bucket array that
// fills key by key, equal objects landing in the wrong bucket, a stranded
// mutable key, a chain turning into a tree, a table doubling on one bit,
// lost updates between threads, ConcurrentHashMap's per-bucket locks, the
// modCount check, and quick looks at ArrayList, LRU, TreeMap and the heap.
// Widths only, never heights; the top-right corner stays free for the term card.
import type { CSSProperties, ReactNode } from "react";
import type { Clock } from "../lib/timeline.ts";
import { C, MONO } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, Big, clamp01, from } from "./custom3.tsx";

type CP = { t: Clock; props?: Record<string, unknown> };

const Svg = ({ children }: { children: ReactNode }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

const Arrow = ({ x1, y1, x2, y2, color = C.muted, p = 1 }: { x1: number; y1: number; x2: number; y2: number; color?: string; p?: number }) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g>
      <line x1={x1} y1={y1} x2={lerp(x1, x2, p)} y2={lerp(y1, y2, p)} stroke={color} strokeWidth={4} strokeLinecap="round" />
      {p > 0.95 && <polygon points={`${x2},${y2} ${x2 - 18 * Math.cos(a - 0.42)},${y2 - 18 * Math.sin(a - 0.42)} ${x2 - 18 * Math.cos(a + 0.42)},${y2 - 18 * Math.sin(a + 0.42)}`} fill={color} />}
    </g>
  );
};

// one slot of the bucket array
const Slot = ({ x, y, i, hot, h = 40 }: { x: number; y: number; i: number; hot?: string; h?: number }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 80, height: h, borderRadius: 8, background: hot ? `${hot}22` : C.card, border: `2px solid ${hot ?? C.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 22, color: hot ? C.text : C.faint }}>
    [{i}]
  </div>
);

// one node of a chain
const NodeBox = ({ x, y, k, v, col, style }: { x: number; y: number; k: string; v: string; col: string; style?: CSSProperties }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 230, borderRadius: 10, background: C.card, border: `2px solid ${col}`, padding: "6px 14px", display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 24, ...style }}>
    <span>{k}</span>
    <span style={{ color: col }}>{v}</span>
  </div>
);

// ------------------------------------------------------------------ hook: scan a list vs jump to a bucket

export const Lookup = ({ t }: CP) => {
  const f = t.frame;
  const scan = clamp01((f - 20) / 160);
  const jump = t.step >= 1 ? ease(f, at(t, 1) + 20, 20) : 0;
  return (
    <>
      <Abs x={160} y={270} w={760} style={{ fontSize: 32, fontWeight: 800, ...rise(f, 4) }}>a list: check every player</Abs>
      <Svg>
        {Array.from({ length: 300 }, (_, i) => (
          <rect key={i} x={160 + (i % 25) * 30} y={340 + Math.floor(i / 25) * 30} width={22} height={22} rx={4} fill={i / 300 < scan ? C.amber : C.card2} />
        ))}
      </Svg>
      <Abs x={160} y={720} w={760} style={{ fontFamily: MONO, fontSize: 30, color: C.amber }}>~1,000,000 checks per lookup</Abs>
      {t.step >= 1 && (
        <div style={{ opacity: from(t, 1) }}>
          <Abs x={1060} y={270} w={760} style={{ fontSize: 32, fontWeight: 800 }}>a HashMap: jump to one bucket</Abs>
          {Array.from({ length: 8 }, (_, i) => (
            <Slot key={i} x={1060} y={340 + i * 48} i={i} hot={i === 5 && jump > 0.9 ? C.green : undefined} />
          ))}
          <Abs x={lerp(1500, 1170, jump)} y={lerp(300, 580, jump)} w={300} style={{ ...card(C.green), padding: "8px 14px", fontFamily: MONO, fontSize: 24 }}>get("Rohit")</Abs>
          <Abs x={1060} y={760} w={760} style={{ fontFamily: MONO, fontSize: 30, color: C.green }}>about one step</Abs>
        </div>
      )}
      {t.step >= 2 && (
        <Abs x={0} y={840} w={1920} style={{ textAlign: "center", ...rise(f, at(t, 2)) }}>
          <Big size={40}>so how does it know where to jump?</Big>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the bucket array fills, key by key

export const BucketFill = ({ t }: CP) => {
  const f = t.frame;
  const keys = [
    { k: '"Aa"', v: "10", b: 0, pos: 0, hc: "2112", bits: "0000", col: C.blue, step: 2 },
    { k: '"BB"', v: "20", b: 0, pos: 1, hc: "2112", bits: "0000", col: C.blue, step: 2 },
    { k: '"Shami"', v: "12", b: 10, pos: 0, hc: "79847208", bits: "1010", col: C.green, step: 1 },
    { k: '"Dhoni"', v: "56", b: 9, pos: 0, hc: "66007878", bits: "1001", col: C.green, step: 1 },
    { k: '"Rohit"', v: "45", b: 1, pos: 0, hc: "79138838", bits: "0001", col: C.amber, step: 4 },
    { k: '"Ishan"', v: "30", b: 1, pos: 1, hc: "70946059", bits: "0001", col: C.amber, step: 4 },
  ];
  const sy = (b: number) => 230 + b * 44;
  const cur = [...keys].reverse().find((k) => t.step === k.step) ?? null;
  return (
    <>
      {Array.from({ length: 16 }, (_, i) => (
        <Slot key={i} x={140} y={sy(i)} i={i} h={36} hot={keys.some((k) => k.b === i && t.step >= k.step) ? keys.find((k) => k.b === i)!.col : undefined} />
      ))}
      {keys.map((k, i) => {
        if (t.step < k.step) return null;
        const p = Math.min(1, pop(f, at(t, k.step) + 40 + k.pos * 40));
        return <NodeBox key={i} x={260 + k.pos * 270} y={sy(k.b) - 2} k={k.k} v={k.v} col={k.col} style={{ opacity: p, transform: `translateX(${(1 - p) * 200}px)`, fontSize: 22, padding: "3px 12px" }} />;
      })}
      {t.step === 0 && (
        <Abs x={900} y={300} w={880} style={{ ...rise(f, 20) }}>
          <Big size={44}>a HashMap is an array of buckets</Big>
          <div style={{ fontSize: 30, color: C.muted, marginTop: 14 }}>16 of them to start. each bucket holds a chain of nodes:</div>
          <div style={{ fontFamily: MONO, fontSize: 30, marginTop: 14, color: C.blue }}>hash | key | value | next</div>
        </Abs>
      )}
      {cur && (
        <Abs x={900} y={300} w={880} style={{ ...card(cur.col), padding: "24px 30px", ...rise(f, at(t, cur.step)) }}>
          <div style={{ fontFamily: MONO, fontSize: 32 }}>put({cur.k}, {cur.v})</div>
          <div style={{ fontFamily: MONO, fontSize: 26, color: C.muted, marginTop: 14, opacity: enter(f, at(t, cur.step) + 10) }}>hashCode = {cur.hc}</div>
          <div style={{ fontFamily: MONO, fontSize: 26, color: C.muted, marginTop: 6, opacity: enter(f, at(t, cur.step) + 20) }}>mix: h XOR (h &gt;&gt;&gt; 16)</div>
          <div style={{ fontFamily: MONO, fontSize: 26, marginTop: 6, opacity: enter(f, at(t, cur.step) + 30) }}>
            last 4 bits: <span style={{ color: cur.col }}>{cur.bits}</span> = bucket {cur.b}
          </div>
        </Abs>
      )}
      {t.step === 3 && (
        <Abs x={900} y={300} w={880} style={{ ...card(C.blue), padding: "24px 30px", ...rise(f, at(t, 3)) }}>
          <div style={{ fontFamily: MONO, fontSize: 32 }}>get("BB")</div>
          <div style={{ fontSize: 28, marginTop: 14 }}>bucket 0 → node "Aa": hash 2112 matches</div>
          <div style={{ fontSize: 28, marginTop: 6, color: C.red, opacity: enter(f, at(t, 3) + 30) }}>equals("Aa")? no</div>
          <div style={{ fontSize: 28, marginTop: 6, color: C.green, opacity: enter(f, at(t, 3) + 60) }}>next node "BB": equals? yes → 20</div>
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={900} y={620} w={880} style={{ ...rise(f, at(t, 4) + 90) }}>
          <Chip color={C.amber} style={{ fontSize: 26 }}>different hashCodes, same bucket: still a collision</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ equals without hashCode: the wrong bucket

export const Contract = ({ t }: CP) => {
  const f = t.frame;
  const fly = t.step >= 1 ? ease(f, at(t, 1) + 20, 30) : 0;
  return (
    <>
      <Abs x={140} y={260} w={760} style={{ ...card(C.line), padding: "20px 26px", fontFamily: MONO, fontSize: 26, lineHeight: 1.5, ...rise(f, 4) }}>
        class Point {"{"} int x, y;
        <br />
        &nbsp;&nbsp;equals(): <span style={{ color: C.green }}>overridden</span>
        <br />
        &nbsp;&nbsp;hashCode(): <span style={{ color: t.step >= 2 ? C.green : C.red }}>{t.step >= 2 ? "Objects.hash(x, y)" : "NOT overridden"}</span> {"}"}
      </Abs>
      {t.step === 0 && (
        <Abs x={140} y={520} w={1640} style={{ ...rise(f, 30) }}>
          <Big size={46}>hashCode picks the bucket. equals picks the entry.</Big>
        </Abs>
      )}
      {t.step >= 1 && (
        <>
          {[3, 11].map((b, i) => (
            <Abs key={b} x={1040} y={300 + i * 180} w={680} style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{ width: 90, padding: "10px 0", textAlign: "center", borderRadius: 8, border: `2px solid ${C.line}`, background: C.card, fontFamily: MONO, fontSize: 24 }}>[{t.step >= 2 ? 3 : b}]</div>
              {(i === 0 || t.step < 2) && (
                <div style={{ ...card(i === 0 ? C.blue : C.pink), padding: "8px 16px", fontFamily: MONO, fontSize: 24, opacity: i === 0 ? 1 : fly }}>
                  {i === 0 ? 'put(new Point(1,2), "home")' : "get(new Point(1,2))"}
                </div>
              )}
            </Abs>
          ))}
          {t.step === 1 && (
            <Abs x={140} y={560} w={760} style={{ ...rise(f, at(t, 1) + 50) }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: C.red }}>equal objects, different default hashCodes</div>
              <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>the lookup goes to another bucket, so equals never runs</div>
              <div style={{ fontFamily: MONO, fontSize: 28, marginTop: 14 }}>get → null · size() → 2</div>
            </Abs>
          )}
          {t.step >= 2 && (
            <Abs x={140} y={560} w={1640} style={{ ...rise(f, at(t, 2)) }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: C.green }}>same fields in equals and hashCode → same bucket → found</div>
              <div style={{ fontFamily: MONO, fontSize: 28, marginTop: 14, color: C.muted }}>or simply: record Point(int x, int y) {"{}"}</div>
            </Abs>
          )}
        </>
      )}
    </>
  );
};

// ------------------------------------------------------------------ a mutable key strands its entry

export const Stranded = ({ t }: CP) => {
  const f = t.frame;
  const changed = t.step >= 1 && f > at(t, 1) + 30;
  return (
    <>
      <Abs x={140} y={260} w={700} style={{ ...card(), padding: "18px 24px", fontFamily: MONO, fontSize: 26, lineHeight: 1.6, ...rise(f, 4) }}>
        Point p = new Point(1, 2);
        <br />
        labels.put(p, "home");
        {t.step >= 1 && (
          <>
            <br />
            <span style={{ color: C.red }}>p.x = 5;</span>
          </>
        )}
      </Abs>
      <Abs x={1000} y={280} w={800} style={{ display: "flex", gap: 20, alignItems: "center", ...rise(f, 10) }}>
        <div style={{ width: 200, fontSize: 24, color: C.muted }}>bucket of (1, 2)</div>
        <div style={{ ...card(changed ? C.red : C.green), padding: "10px 18px", fontFamily: MONO, fontSize: 26 }}>
          key ({changed ? "5" : "1"}, 2) · "home"
        </div>
      </Abs>
      <Abs x={1000} y={400} w={800} style={{ display: "flex", gap: 20, alignItems: "center", opacity: t.step >= 2 ? 1 : 0.4 }}>
        <div style={{ width: 200, fontSize: 24, color: C.muted }}>bucket of (5, 2)</div>
        <div style={{ fontSize: 26, color: C.faint }}>empty</div>
      </Abs>
      {t.step >= 2 && (
        <Abs x={140} y={560} w={1640} style={{ ...rise(f, at(t, 2)) }}>
          <div style={{ fontFamily: MONO, fontSize: 28 }}>get(p) → hashes (5, 2) → empty bucket → <span style={{ color: C.red }}>null</span></div>
          <div style={{ fontFamily: MONO, fontSize: 28, marginTop: 10, opacity: enter(f, at(t, 2) + 40) }}>
            get(new Point(1, 2)) → right bucket → equals fails → <span style={{ color: C.red }}>null</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.amber, marginTop: 20, opacity: enter(f, at(t, 2) + 80) }}>size() still says 1: unreachable, a memory leak</div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={140} y={800} w={1640} style={{ ...rise(f, at(t, 3)) }}>
          <Chip color={C.green} style={{ fontSize: 28 }}>immutable keys: String, records, Integer, UUID, enums</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ a chain becomes a tree

export const ChainTree = ({ t }: CP) => {
  const f = t.frame;
  const n = t.step === 0 ? Math.min(8, Math.floor((f - 10) / 12) + 1) : 9;
  const tree = t.step >= 3 ? ease(f, at(t, 3) + 10, 40) : 0;
  const tableSize = t.step >= 2 ? (f > at(t, 2) + 60 ? 64 : 32) : 16;
  const pos = [
    [1310, 330], [1210, 420], [1410, 420], [1160, 510], [1260, 510], [1360, 510], [1460, 510], [1410, 600], [1510, 600],
  ];
  return (
    <>
      <Abs x={140} y={260} w={900} style={{ fontFamily: MONO, fontSize: 28, color: C.muted, ...rise(f, 4) }}>
        keys with the same hashCode, one bucket · table: <span style={{ color: t.step === 2 ? C.amber : C.text }}>{tableSize} buckets</span>
      </Abs>
      {Array.from({ length: n }, (_, i) => {
        const lx = 140 + i * 100;
        const ly = 340;
        const [tx, ty] = pos[i];
        return (
          <div key={i} style={{ position: "absolute", left: lerp(lx, tx - 36, tree), top: lerp(ly, ty - 26, tree), width: 72, height: 52, borderRadius: tree > 0.5 ? 26 : 10, background: C.card, border: `2px solid ${i === 8 ? C.pink : tree > 0.5 && (i === 1 || i >= 7) ? C.red : C.amber}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 22, opacity: Math.min(1, pop(f, i < 8 ? 10 + i * 12 : at(t, 1))) }}>
            k{i + 1}
          </div>
        );
      })}
      {t.step === 1 && (
        <Abs x={140} y={480} w={1640} style={{ ...rise(f, at(t, 1) + 20) }}>
          <div style={{ fontSize: 32, fontWeight: 800 }}>the 9th node: does the table have 64 buckets?</div>
        </Abs>
      )}
      {t.step === 2 && (
        <Abs x={140} y={480} w={1640} style={{ ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.amber }}>no: resize instead. 16 → 32, then 32 → 64</div>
          <div style={{ fontSize: 26, color: C.muted, marginTop: 10 }}>in a small table, a crowded bucket means the table is too small</div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={140} y={480} w={900} style={{ ...rise(f, at(t, 3) + 20) }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.green }}>64 buckets: the chain becomes a red-black tree</div>
          <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>lookups in this bucket: O(n) → O(log n)</div>
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={140} y={700} w={900} style={{ display: "flex", flexWrap: "wrap", gap: 14, ...rise(f, at(t, 4)) }}>
          <Chip color={C.blue} style={{ fontSize: 24 }}>TREEIFY_THRESHOLD = 8</Chip>
          <Chip color={C.blue} style={{ fontSize: 24 }}>MIN_TREEIFY_CAPACITY = 64</Chip>
          <Chip color={C.cyan} style={{ fontSize: 24 }}>back to a list at 6</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ resize: one bit decides

export const GrowTable = ({ t }: CP) => {
  const f = t.frame;
  const count = t.step === 0 ? Math.min(13, Math.floor((f - 10) / 10) + 1) : 13;
  const split = t.step >= 2 ? ease(f, at(t, 2) + 40, 40) : 0;
  return (
    <>
      <Abs x={140} y={260} w={900} style={{ ...rise(f, 4) }}>
        <div style={{ fontFamily: MONO, fontSize: 30 }}>
          entries: <span style={{ color: count > 12 ? C.red : C.text }}>{count}</span> · threshold = 16 × 0.75 = 12
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
          {Array.from({ length: 16 }, (_, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 6, background: i < count ? C.amber : C.card2 }} />
          ))}
        </div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={140} y={420} w={900} style={{ fontSize: 32, fontWeight: 800, color: C.amber, ...rise(f, at(t, 1)) }}>
          the 13th put: the table doubles to 32
        </Abs>
      )}
      {t.step >= 2 && (
        <>
          <Abs x={1100} y={260} w={700} style={{ fontFamily: MONO, fontSize: 28, lineHeight: 1.6, ...rise(f, at(t, 2)) }}>
            Rohit ...<span style={{ color: C.green }}>0</span> 0001
            <br />
            Ishan ...<span style={{ color: C.pink }}>1</span> 0001
            <div style={{ fontFamily: "inherit", fontSize: 22, color: C.muted }}>the bit worth 16 decides</div>
          </Abs>
          {[
            [1, '"Rohit"', "45", C.green, 0],
            [17, '"Ishan"', "30", C.pink, 1],
          ].map(([b, k, v, col, moves]) => (
            <Abs key={b as number} x={140} y={lerp(540, 540 + (moves as number) * 120, split)} w={900} style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{ width: 90, padding: "10px 0", textAlign: "center", borderRadius: 8, border: `2px solid ${col}`, background: C.card, fontFamily: MONO, fontSize: 24 }}>[{split > 0.5 ? b : 1}]</div>
              <div style={{ ...card(col as string), padding: "8px 16px", fontFamily: MONO, fontSize: 24 }}>
                {k} · {v}
              </div>
              <div style={{ fontSize: 24, color: col as string, opacity: split }}>{moves ? "bit 1: 1 + 16 = 17" : "bit 0: stays"}</div>
            </Abs>
          ))}
        </>
      )}
      {t.step >= 3 && (
        <Abs x={1100} y={560} w={700} style={{ ...card(C.purple), padding: "18px 24px", ...rise(f, at(t, 3)) }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>one put pays for the whole copy</div>
          <div style={{ fontFamily: MONO, fontSize: 24, color: C.muted, marginTop: 8 }}>pre-size: HashMap.newHashMap(n)</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ powers of two, and mixing the hash

export const PowerTwo = ({ t }: CP) => {
  const f = t.frame;
  const rows: [string, number, number][] = [
    ["65536", 0, 1],
    ["131072", 0, 2],
    ["196608", 0, 3],
  ];
  return (
    <>
      <Abs x={140} y={270} w={800} style={{ ...card(C.blue), padding: "22px 28px", ...rise(f, 4) }}>
        <div style={{ fontSize: 28, color: C.muted }}>n = 16, so n - 1 = </div>
        <div style={{ fontFamily: MONO, fontSize: 44, fontWeight: 800, marginTop: 6 }}>h AND 1111</div>
        <div style={{ fontSize: 28, marginTop: 8 }}>= h % 16, in one fast instruction</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={1000} y={270} w={780} style={{ ...card(C.green), padding: "22px 28px", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 30, fontWeight: 800 }}>doubling adds exactly one bit</div>
          <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>so a resize can split each bucket on that one bit</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={140} y={520} w={1640} style={{ ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 14 }}>why mix: h XOR (h &gt;&gt;&gt; 16)</div>
          {rows.map(([k, a, b], i) => (
            <div key={k} style={{ display: "flex", gap: 30, fontFamily: MONO, fontSize: 28, padding: "6px 0", opacity: enter(f, at(t, 2) + 20 + i * 15) }}>
              <span style={{ width: 160 }}>{k}</span>
              <span style={{ width: 360, color: C.red }}>without mixing → [{a}]</span>
              <span style={{ color: C.green, opacity: enter(f, at(t, 2) + 80) }}>with mixing → [{b}]</span>
            </div>
          ))}
          <div style={{ fontSize: 26, color: C.muted, marginTop: 12 }}>only the low bits pick the bucket, so the high bits get folded down</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ two threads, one lost update

export const LostUpdate = ({ t }: CP) => {
  const f = t.frame;
  const s = at(t, 1);
  const lines: [number, string, string, string][] = [
    [0, "A", "reads 41", C.blue],
    [20, "B", "reads 41", C.pink],
    [45, "A", "writes 42", C.blue],
    [65, "B", "writes 42", C.pink],
  ];
  return (
    <>
      <Abs x={140} y={260} w={800} style={{ ...card(), padding: "18px 24px", fontFamily: MONO, fontSize: 26, lineHeight: 1.6, ...rise(f, 4) }}>
        int v = views.getOrDefault(page, 0);
        <br />
        views.put(page, v + 1);
      </Abs>
      {t.step === 0 && (
        <Abs x={140} y={460} w={1640} style={{ fontSize: 30, color: C.muted, ...rise(f, 30) }}>
          two threads, each counting 50,000 views of /home
        </Abs>
      )}
      {t.step >= 1 && (
        <Abs x={1040} y={260} w={740}>
          {lines.map(([d, who, what, col], i) => (
            <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", fontFamily: MONO, fontSize: 28, padding: "8px 0", opacity: enter(f, s + d) }}>
              <span style={{ ...card(col), padding: "4px 14px" }}>thread {who}</span>
              {what}
            </div>
          ))}
          <div style={{ fontSize: 30, fontWeight: 800, color: C.red, marginTop: 12, opacity: enter(f, s + 95) }}>two views counted as one</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={140} y={620} w={1640} style={{ ...rise(f, at(t, 2)) }}>
          <div style={{ ...card(C.green), padding: "18px 24px", fontFamily: MONO, fontSize: 30, display: "inline-block" }}>views.merge(page, 1, Integer::sum);</div>
          <div style={{ fontSize: 28, color: C.muted, marginTop: 14 }}>one atomic call on a ConcurrentHashMap: 100,000 exactly</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ ConcurrentHashMap: lock one bucket, not the map

export const ChmLocks = ({ t }: CP) => {
  const f = t.frame;
  const cas = t.step >= 1 ? ease(f, at(t, 1) + 20, 20) : 0;
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const locked = t.step >= 2 && i === 4;
        const filled = (t.step >= 1 && i === 2) || i === 4 || i === 6;
        return (
          <Abs key={i} x={140} y={260 + i * 70} w={760} style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <div style={{ width: 80, padding: "8px 0", textAlign: "center", borderRadius: 8, border: `2px solid ${locked ? C.amber : C.line}`, background: C.card, fontFamily: MONO, fontSize: 22 }}>[{i}]</div>
            {filled && (
              <div style={{ ...card(locked ? C.amber : C.line), padding: "6px 14px", fontFamily: MONO, fontSize: 22, opacity: i === 2 ? cas : 1 }}>
                {locked ? "🔒 " : ""}node
              </div>
            )}
          </Abs>
        );
      })}
      {t.step === 0 && (
        <Abs x={1000} y={300} w={780} style={{ ...rise(f, 20) }}>
          <Big size={42}>the same bucket array, built for many threads</Big>
        </Abs>
      )}
      {t.step >= 1 && (
        <Abs x={1000} y={300} w={780} style={{ ...card(C.green), padding: "18px 24px", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>empty bucket: CAS, no lock</div>
          <div style={{ fontSize: 24, color: C.muted, marginTop: 6 }}>write only if the slot is still empty; lost the race? retry</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1000} y={450} w={780} style={{ ...card(C.amber), padding: "18px 24px", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>busy bucket: lock its first node</div>
          <div style={{ fontSize: 24, color: C.muted, marginTop: 6 }}>writers to other buckets keep going</div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={1000} y={600} w={780} style={{ ...card(C.blue), padding: "18px 24px", ...rise(f, at(t, 3)) }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>get(): no lock at all</div>
          <div style={{ fontSize: 24, color: C.muted, marginTop: 6 }}>volatile reads see the latest completed write</div>
        </Abs>
      )}
      {t.step >= 4 && (
        <Abs x={1000} y={760} w={780} style={{ display: "flex", flexWrap: "wrap", gap: 12, ...rise(f, at(t, 4)) }}>
          <Chip color={C.red} style={{ fontSize: 22 }}>no null keys or values</Chip>
          <Chip color={C.purple} style={{ fontSize: 22 }}>Java 7: 16 segments</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the modCount check

export const ModCount = ({ t }: CP) => {
  const f = t.frame;
  const bumped = t.step >= 1 && f > at(t, 1) + 40;
  return (
    <>
      <Abs x={140} y={260} w={860} style={{ ...card(), padding: "18px 24px", fontFamily: MONO, fontSize: 26, lineHeight: 1.6, ...rise(f, 4) }}>
        for (Player p : players)
        <br />
        &nbsp;&nbsp;if (p.isOffline()) <span style={{ color: C.red }}>players.remove(p);</span>
      </Abs>
      <Abs x={1080} y={260} w={700} style={{ display: "flex", gap: 20, ...rise(f, 20) }}>
        <div style={{ ...card(C.blue), padding: "16px 20px", textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 22, color: C.muted }}>list.modCount</div>
          <div style={{ fontFamily: MONO, fontSize: 48, fontWeight: 800, color: bumped ? C.red : C.text }}>{bumped ? 8 : 7}</div>
        </div>
        <div style={{ ...card(C.purple), padding: "16px 20px", textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 22, color: C.muted }}>iterator saved</div>
          <div style={{ fontFamily: MONO, fontSize: 48, fontWeight: 800 }}>7</div>
        </div>
      </Abs>
      {t.step === 0 && (
        <Abs x={140} y={500} w={1640} style={{ fontSize: 30, color: C.muted, ...rise(f, 40) }}>one thread, a plain for-each loop</Abs>
      )}
      {t.step >= 1 && (
        <Abs x={140} y={500} w={1640} style={{ ...rise(f, at(t, 1) + 60) }}>
          <div style={{ fontSize: 30 }}>next(): 8 ≠ 7 →</div>
          <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 800, color: C.red, marginTop: 8 }}>ConcurrentModificationException</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={140} y={700} w={1640} style={{ display: "flex", gap: 16, flexWrap: "wrap", ...rise(f, at(t, 2)) }}>
          <Chip color={C.green} style={{ fontSize: 26, fontFamily: MONO }}>players.removeIf(Player::isOffline)</Chip>
          <Chip color={C.green} style={{ fontSize: 26, fontFamily: MONO }}>iterator.remove()</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ ArrayList grows; LinkedList walks

export const ArrayGrow = ({ t }: CP) => {
  const f = t.frame;
  const caps = [10, 15, 22];
  const stage = t.step === 0 ? Math.min(2, Math.floor((f - 20) / 50)) : 2;
  const walk = t.step >= 1 ? Math.min(10, Math.floor((f - at(t, 1) - 20) / 8)) : -1;
  return (
    <>
      <Abs x={140} y={260} w={1640} style={{ ...rise(f, 4) }}>
        <div style={{ fontSize: 30, fontWeight: 800 }}>ArrayList: one array, grows 1.5x</div>
        <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
          {Array.from({ length: caps[stage] }, (_, i) => (
            <div key={i} style={{ width: 52, height: 52, borderRadius: 6, background: i < caps[Math.max(0, stage - 1)] ? C.blue : C.card2, border: `2px solid ${C.line}` }} />
          ))}
          <span style={{ fontFamily: MONO, fontSize: 28, marginLeft: 16, alignSelf: "center" }}>capacity {caps[stage]}</span>
        </div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 10 }}>get(i): jump straight to slot i, O(1)</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={140} y={520} w={1640} style={{ ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 30, fontWeight: 800 }}>LinkedList: get(10) walks node by node</div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center" }}>
            {Array.from({ length: 11 }, (_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 70, height: 52, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 22, background: C.card, border: `2px solid ${i <= walk ? C.amber : C.line}` }}>{i}</div>
                {i < 10 && <span style={{ color: C.muted }}>⇄</span>}
              </div>
            ))}
          </div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={140} y={760} w={1640} style={{ ...rise(f, at(t, 2)) }}>
          <Chip color={C.green} style={{ fontSize: 28 }}>default to ArrayList · ArrayDeque for queues and stacks</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ LRU with LinkedHashMap

export const LruList = ({ t }: CP) => {
  const f = t.frame;
  const orders = [
    ["u1", "u2", "u3"],
    ["u2", "u3", "u1"],
    ["u3", "u1", "u4"],
  ];
  const o = orders[Math.min(2, t.step)];
  return (
    <>
      <Abs x={140} y={270} w={1640} style={{ fontSize: 30, fontWeight: 800, ...rise(f, 4) }}>
        {t.step === 0 ? "a HashMap plus a linked list through its entries" : t.step === 1 ? "access order: get(u1) moves u1 to the tail" : "cap 3: put(u4) evicts the head, u2"}
      </Abs>
      <Abs x={140} y={380} w={1640} style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <span style={{ fontSize: 26, color: C.muted }}>head</span>
        {o.map((u, i) => (
          <div key={`${t.step}-${u}`} style={{ display: "flex", gap: 20, alignItems: "center", opacity: Math.min(1, pop(f, at(t, Math.min(2, t.step)) + i * 8)) }}>
            <div style={{ ...card(i === 0 ? C.amber : i === o.length - 1 && t.step > 0 ? C.green : C.line), padding: "18px 30px", fontFamily: MONO, fontSize: 30 }}>{u}</div>
            {i < o.length - 1 && <span style={{ fontSize: 30, color: C.muted }}>⇄</span>}
          </div>
        ))}
        <span style={{ fontSize: 26, color: C.muted }}>tail</span>
      </Abs>
      {t.step >= 2 && (
        <Abs x={140} y={560} w={1640} style={{ ...card(C.blue), padding: "18px 24px", fontFamily: MONO, fontSize: 26, lineHeight: 1.6, ...rise(f, at(t, 2) + 30) }}>
          super(16, 0.75f, <span style={{ color: C.green }}>true</span>); // access order
          <br />
          removeEldestEntry(e) {"{"} return size() &gt; cap; {"}"}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ TreeMap floor lookup

export const TreeFloor = ({ t }: CP) => {
  const f = t.frame;
  const slabs: [string, string][] = [
    ["0", "0%"],
    ["300,000", "5%"],
    ["700,000", "10%"],
  ];
  const probe = ease(f, 30, 40);
  return (
    <>
      <Abs x={140} y={270} w={1640} style={{ fontSize: 30, fontWeight: 800, ...rise(f, 4) }}>TreeMap: sorted keys, O(log n), and nearest-key lookups</Abs>
      <Svg>
        <line x1={200} y1={520} x2={1700} y2={520} stroke={C.line} strokeWidth={6} />
        {[200, 800, 1400].map((x, i) => (
          <circle key={x} cx={x} cy={520} r={16} fill={i === 1 && probe > 0.9 ? C.green : C.card2} stroke={C.text} strokeWidth={3} />
        ))}
        <line x1={lerp(200, 1100, probe)} y1={440} x2={lerp(200, 1100, probe)} y2={600} stroke={C.amber} strokeWidth={4} strokeDasharray="10 8" />
      </Svg>
      {slabs.map(([k, v], i) => (
        <Abs key={k} x={[200, 800, 1400][i] - 120} y={560} w={240} style={{ textAlign: "center", fontFamily: MONO, fontSize: 26 }}>
          {k}
          <div style={{ color: C.muted }}>{v}</div>
        </Abs>
      ))}
      <Abs x={lerp(200, 1100, probe) - 150} y={390} w={300} style={{ textAlign: "center", fontFamily: MONO, fontSize: 26, color: C.amber }}>450,000</Abs>
      <Abs x={140} y={720} w={1640} style={{ ...rise(f, 80) }}>
        <span style={{ ...card(C.green), padding: "12px 20px", fontFamily: MONO, fontSize: 28 }}>floorEntry(450000) → 300,000 = 5%</span>
      </Abs>
      {t.step >= 1 && (
        <Abs x={140} y={820} w={1640} style={{ fontSize: 28, color: C.muted, ...rise(f, at(t, 1)) }}>
          it uses only compareTo, so compare = 0 means the same key
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ PriorityQueue: only the head is ordered

export const Heap = ({ t }: CP) => {
  const f = t.frame;
  const arr = [1, 2, 4, 5, 3];
  const pos: [number, number][] = [
    [960, 300], [760, 430], [1160, 430], [660, 560], [860, 560],
  ];
  return (
    <>
      <Svg>
        {[
          [0, 1],
          [0, 2],
          [1, 3],
          [1, 4],
        ].map(([a, b]) => (
          <line key={`${a}${b}`} x1={pos[a][0]} y1={pos[a][1]} x2={pos[b][0]} y2={pos[b][1]} stroke={C.line} strokeWidth={4} opacity={enter(f, 20)} />
        ))}
        {arr.map((v, i) => (
          <g key={i} opacity={Math.min(1, pop(f, 10 + i * 8))}>
            <circle cx={pos[i][0]} cy={pos[i][1]} r={40} fill={i === 0 ? `${C.green}33` : C.card} stroke={i === 0 ? C.green : C.text} strokeWidth={3} />
            <text x={pos[i][0]} y={pos[i][1] + 12} textAnchor="middle" fontSize={34} fill={C.text} fontFamily={MONO}>
              {v}
            </text>
          </g>
        ))}
      </Svg>
      <Abs x={1240} y={500} w={560} style={{ ...rise(f, 40) }}>
        <div style={{ fontFamily: MONO, fontSize: 28 }}>printed: [1, 2, 4, 5, 3]</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>parent ≤ children; only the head is in order</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={140} y={700} w={1640} style={{ display: "flex", gap: 16, flexWrap: "wrap", ...rise(f, at(t, 1)) }}>
          <Chip color={C.blue} style={{ fontSize: 26 }}>offer / poll: O(log n)</Chip>
          <Chip color={C.blue} style={{ fontSize: 26 }}>peek: O(1)</Chip>
          <Chip color={C.amber} style={{ fontSize: 26 }}>max-heap: Comparator.reverseOrder()</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the recall task

export const DrawIt = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      <Abs x={260} y={320} w={1400} style={{ textAlign: "center", ...rise(f, 4) }}>
        <div style={{ fontSize: 100 }}>✏️</div>
        <Big size={50} style={{ marginTop: 10 }}>from memory: draw the 16 buckets after the six puts</Big>
      </Abs>
      {t.step >= 1 && (
        <Abs x={260} y={620} w={1400} style={{ textAlign: "center", ...rise(f, at(t, 1)) }}>
          <Big size={38} color={C.amber}>then walk put("Ishan", 30) through every step, and say where it goes at 32 buckets</Big>
        </Abs>
      )}
    </>
  );
};

