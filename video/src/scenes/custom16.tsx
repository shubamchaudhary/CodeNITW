// Java Part 4 scenes (JVM memory and garbage collection): a heap that creeps
// up to OutOfMemoryError, stack frames pushing and popping, tracing from GC
// roots, four reference strengths, objects ageing through Eden and the
// survivor spaces, mark-sweep-compact, collector pauses on a timeline, G1
// regions, a leaking static map, and a JVM inside a 1 GiB pod.
// Widths only, never heights; the top-right corner stays free for the term card.
import type { ReactNode } from "react";
import type { Clock } from "../lib/timeline.ts";
import { C, MONO } from "../lib/theme.ts";
import { ease, enter, lerp, pop, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, Big, clamp01 } from "./custom3.tsx";

type CP = { t: Clock; props?: Record<string, unknown> };

const Svg = ({ children }: { children: ReactNode }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

// heap usage over time: rises, drops at each GC; `leak` makes the floor creep up
const usage = (x: number, leak: boolean) => {
  const cycle = (x % 120) / 120;
  const floor = leak ? 0.15 + (x / 1300) * 0.7 : 0.2;
  return floor + cycle * 0.25;
};

const HeapGraph = ({ x0, y0, w, h, p, leak, label }: { x0: number; y0: number; w: number; h: number; p: number; leak: boolean; label: string }) => {
  const n = Math.floor(w * p);
  const pts: string[] = [];
  for (let x = 0; x <= n; x += 4) pts.push(`${x0 + x},${y0 + h - Math.min(1, usage(x, leak)) * h}`);
  return (
    <>
      <Svg>
        <rect x={x0} y={y0} width={w} height={h} rx={10} fill={C.card} stroke={C.line} strokeWidth={2} />
        <line x1={x0} y1={y0 + 18} x2={x0 + w} y2={y0 + 18} stroke={C.red} strokeWidth={3} strokeDasharray="12 8" />
        <polyline points={pts.join(" ")} fill="none" stroke={leak ? C.amber : C.green} strokeWidth={4} />
      </Svg>
      <Abs x={x0 + w - 260} y={y0 + 24} w={250} style={{ textAlign: "right", fontFamily: MONO, fontSize: 22, color: C.red }}>-Xmx</Abs>
      <Abs x={x0} y={y0 + h + 12} w={w} style={{ fontSize: 24, color: C.muted }}>{label}</Abs>
    </>
  );
};

// ------------------------------------------------------------------ hook: dies every three days

export const Sawtooth = ({ t }: CP) => {
  const f = t.frame;
  const p = clamp01((f - 10) / 200);
  return (
    <>
      <HeapGraph x0={160} y0={280} w={1300} h={420} p={p} leak label="heap used: each drop is a garbage collection" />
      {p > 0.98 && (
        <Abs x={1180} y={240} w={600} style={{ ...card(C.red), padding: "12px 18px", fontFamily: MONO, fontSize: 24, opacity: enter(f, 215) }}>
          OutOfMemoryError: Java heap space
        </Abs>
      )}
      {t.step >= 1 && (
        <Abs x={160} y={790} w={1600} style={{ fontSize: 30, ...rise(f, at(t, 1)) }}>
          restart → fine for three more days → dies again
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={160} y={850} w={1600} style={{ ...rise(f, at(t, 2)) }}>
          <Big size={40} color={C.amber}>where does the memory go, and who is supposed to free it?</Big>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ stack frames and the heap

export const Frames = ({ t }: CP) => {
  const f = t.frame;
  const runOn = t.step >= 1 && t.step < 3;
  const popped = t.step >= 3 ? ease(f, at(t, 3) + 10, 24) : 0;
  const rows: [string, string, number][] = [
    ["count", "10", 1],
    ["p1", "ref", 1],
    ["p2", "ref", 1],
    ["s1", "ref", 2],
    ["s2", "ref", 2],
    ["s3", "ref", 2],
  ];
  const sx = 160;
  return (
    <>
      <Abs x={sx} y={240} w={520} style={{ fontSize: 26, fontWeight: 800, color: C.muted, ...rise(f, 4) }}>main thread's stack</Abs>
      <Abs x={sx} y={760} w={520} style={{ ...card(C.line), padding: "14px 20px", ...rise(f, 6) }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.muted }}>frame: main()</div>
        <div style={{ fontFamily: MONO, fontSize: 24, marginTop: 6 }}>demo → ref</div>
      </Abs>
      {(t.step >= 1 || popped > 0) && (
        <Abs x={sx} y={lerp(300, 200, popped)} w={520} style={{ ...card(C.blue), padding: "14px 20px", opacity: (runOn ? Math.min(1, pop(f, at(t, 1))) : 1) * (1 - popped) }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.blue }}>frame: run()</div>
          {rows.map(([n, v, st]) =>
            t.step >= st ? (
              <div key={n} style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 24, padding: "6px 0", borderTop: `1px solid ${C.line}`, ...rise(f, at(t, st) + 20, 10) }}>
                <span>{n}</span>
                <span style={{ color: v === "10" ? C.amber : C.muted }}>{v}</span>
              </div>
            ) : null,
          )}
        </Abs>
      )}
      <Abs x={1000} y={240} w={780} style={{ fontSize: 26, fontWeight: 800, color: C.muted, ...rise(f, 10) }}>heap (shared by all threads)</Abs>
      <Abs x={1000} y={300} w={300} style={{ ...card(C.line), padding: "14px 0", textAlign: "center", fontFamily: MONO, fontSize: 24, ...rise(f, 12) }}>MemoryDemo</Abs>
      {t.step >= 1 && (
        <Abs x={1000} y={400} w={300} style={{ ...card(popped > 0.5 ? C.red : C.green), padding: "14px 0", textAlign: "center", fontFamily: MONO, fontSize: 24, opacity: Math.min(1, pop(f, at(t, 1) + 40)) }}>
          Person{popped > 0.5 ? " (unreferenced)" : ""}
        </Abs>
      )}
      {t.step >= 2 && (
        <>
          <Abs x={1360} y={400} w={420} style={{ ...card(C.purple), padding: "14px 0", textAlign: "center", fontFamily: MONO, fontSize: 24, ...rise(f, at(t, 2) + 60) }}>new String("24")</Abs>
          <Abs x={1000} y={520} w={780} style={{ border: `2px dashed ${C.amber}`, borderRadius: 14, padding: "14px 20px", ...rise(f, at(t, 2) + 20) }}>
            <div style={{ fontSize: 22, color: C.amber, fontWeight: 800 }}>String pool</div>
            <div style={{ ...card(C.amber), padding: "10px 0", textAlign: "center", fontFamily: MONO, fontSize: 24, width: 200, marginTop: 8 }}>"24"</div>
          </Abs>
          <Abs x={1000} y={700} w={780} style={{ fontFamily: MONO, fontSize: 26, ...rise(f, at(t, 2) + 90) }}>
            s1 == s2 <span style={{ color: C.green }}>true</span> · s1 == s3 <span style={{ color: C.red }}>false</span>
          </Abs>
        </>
      )}
      {t.step >= 4 && (
        <Abs x={160} y={900} w={1600} style={{ ...rise(f, at(t, 4)) }}>
          <Chip color={C.red} style={{ fontSize: 24 }}>recursion with no base case → frames pile up → StackOverflowError (-Xss)</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ tracing from GC roots

export const Roots = ({ t }: CP) => {
  const f = t.frame;
  const nodes: { id: string; x: number; y: number; live: boolean }[] = [
    { id: "#1", x: 900, y: 300, live: false },
    { id: "#2", x: 900, y: 450, live: true },
    { id: "map", x: 900, y: 600, live: true },
    { id: "#3", x: 1200, y: 600, live: true },
    { id: "#4", x: 1300, y: 330, live: false },
    { id: "#5", x: 1600, y: 330, live: false },
  ];
  const roots = [
    { id: "local var b", y: 450, to: "#2" },
    { id: "static CACHE", y: 600, to: "map" },
  ];
  const trace = t.step >= 1 ? ease(f, at(t, 1) + 20, 40) : 0;
  const pos = (id: string) => nodes.find((n) => n.id === id)!;
  const color = (n: { live: boolean }) => (t.step >= 1 ? (n.live ? (trace > 0.5 ? C.green : C.line) : t.step >= 2 ? C.red : C.line) : C.line);
  return (
    <>
      {t.step === 0 && (
        <Abs x={160} y={260} w={640} style={{ ...card(), padding: "18px 24px", fontFamily: MONO, fontSize: 26, lineHeight: 1.6, ...rise(f, 4) }}>
          Person a = new Person(); // #1
          <br />
          Person b = new Person(); // #2
          <br />a = b;
        </Abs>
      )}
      {t.step >= 1 &&
        roots.map((r) => (
          <Abs key={r.id} x={160} y={r.y - 30} w={340} style={{ ...card(C.blue), padding: "14px 0", textAlign: "center", fontSize: 26, fontWeight: 800, ...rise(f, at(t, 1)) }}>
            GC root: {r.id}
          </Abs>
        ))}
      <Svg>
        {t.step >= 1 &&
          roots.map((r) => <line key={r.id} x1={500} y1={r.y} x2={lerp(500, pos(r.to).x - 70, trace)} y2={r.y} stroke={C.green} strokeWidth={4} />)}
        <line x1={970} y1={600} x2={lerp(970, 1130, trace)} y2={600} stroke={t.step >= 1 ? C.green : C.line} strokeWidth={4} />
        <path d="M1370,315 C1440,280 1460,280 1530,315" stroke={C.muted} strokeWidth={3} fill="none" />
        <path d="M1530,345 C1460,380 1440,380 1370,345" stroke={C.muted} strokeWidth={3} fill="none" />
      </Svg>
      {nodes.map((n) => (
        <Abs key={n.id} x={n.x - 70} y={n.y - 32} w={140} style={{ ...card(color(n)), padding: "14px 0", textAlign: "center", fontFamily: MONO, fontSize: 24, ...rise(f, 10) }}>
          {n.id}
        </Abs>
      ))}
      {t.step >= 2 && (
        <Abs x={1150} y={430} w={650} style={{ fontSize: 26, color: C.red, fontWeight: 700, ...rise(f, at(t, 2)) }}>
          #4 and #5 point to each other, but no root reaches them: both are garbage
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={160} y={800} w={1600} style={{ ...rise(f, at(t, 3)) }}>
          <Chip color={C.amber} style={{ fontSize: 26 }}>System.gc() is only a hint: the JVM decides when to collect</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ four reference strengths

export const RefKinds = ({ t }: CP) => {
  const f = t.frame;
  const kinds = [
    ["strong", "never collected while reachable", C.green, 10],
    ["soft", "collected only when memory runs low: caches", C.blue, 6],
    ["weak", "collected at the next GC: WeakHashMap", C.amber, 3],
    ["phantom", "get() is null; only says “it's gone”: Cleaner", C.purple, 1],
  ] as const;
  return (
    <>
      {kinds.map(([k, desc, col, thick], i) =>
        t.step >= i ? (
          <Abs key={k} x={160} y={270 + i * 150} w={1600} style={{ display: "flex", alignItems: "center", gap: 30, ...rise(f, at(t, i)) }}>
            <div style={{ ...card(C.blue), padding: "14px 0", width: 140, textAlign: "center", fontFamily: MONO, fontSize: 24 }}>var</div>
            <div style={{ width: 300, height: thick, background: col, borderRadius: 4, borderTop: k === "phantom" ? `3px dashed ${col}` : undefined, opacity: k === "phantom" ? 0.6 : 1 }} />
            <div style={{ ...card(col), padding: "14px 0", width: 180, textAlign: "center", fontFamily: MONO, fontSize: 24 }}>object</div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: col }}>{k}</div>
              <div style={{ fontSize: 24, color: C.muted }}>{desc}</div>
            </div>
          </Abs>
        ) : null,
      )}
    </>
  );
};

// ------------------------------------------------------------------ Eden, survivors, ageing and promotion

type Obj = { id: string; area: "eden" | "s0" | "s1" | "old"; age: number };
const STATES: Obj[][] = [
  [],
  [1, 2, 3, 4, 5].map((i) => ({ id: `O${i}`, area: "eden", age: 0 })),
  [
    { id: "O1", area: "s0", age: 1 },
    { id: "O3", area: "s0", age: 1 },
    { id: "O4", area: "s0", age: 1 },
  ],
  [
    { id: "O1", area: "s1", age: 2 },
    { id: "O3", area: "s1", age: 2 },
    { id: "O7", area: "s1", age: 1 },
  ],
  [
    { id: "O1", area: "old", age: 3 },
    { id: "O3", area: "old", age: 3 },
    { id: "O7", area: "s0", age: 2 },
  ],
];
const AREAS = {
  eden: { x: 160, w: 560, label: "Eden", col: C.green },
  s0: { x: 750, w: 230, label: "S0", col: C.pink },
  s1: { x: 1000, w: 230, label: "S1", col: C.pink },
  old: { x: 1290, w: 480, label: "Old", col: C.amber },
};

export const Eden = ({ t }: CP) => {
  const f = t.frame;
  const st = Math.min(t.step, 4);
  const objs = STATES[st];
  const fresh = st === 3 ? ["O6", "O7"] : [];
  return (
    <>
      {(Object.keys(AREAS) as (keyof typeof AREAS)[]).map((k) => {
        const a = AREAS[k];
        return (
          <Abs key={k} x={a.x} y={300} w={a.w} style={{ border: `3px solid ${a.col}`, borderRadius: 16, padding: "12px 16px", minHeight: 0, ...rise(f, 4) }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: a.col, marginBottom: 10 }}>{a.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, minHeight: 150, alignContent: "flex-start" }}>
              {objs
                .filter((o) => o.area === k)
                .map((o, i) => (
                  <div key={o.id} style={{ ...card(a.col), padding: "8px 14px", textAlign: "center", fontFamily: MONO, fontSize: 22, opacity: Math.min(1, pop(f, at(t, st) + 20 + i * 8)) }}>
                    {o.id}
                    {o.age > 0 && <div style={{ fontSize: 16, color: C.muted }}>age {o.age}</div>}
                  </div>
                ))}
            </div>
          </Abs>
        );
      })}
      <Abs x={160} y={260} w={1070} style={{ fontSize: 22, color: C.muted, ...rise(f, 4) }}>young generation</Abs>
      <Abs x={1290} y={260} w={480} style={{ fontSize: 22, color: C.muted, ...rise(f, 4) }}>old generation</Abs>
      <Abs x={160} y={560} w={1610} style={{ ...rise(f, at(t, st) + 10) }}>
        <div style={{ fontSize: 30, fontWeight: 800 }}>
          {
            [
              "most objects die young, so the heap is split by age",
              "every new object starts in Eden",
              "minor GC 1: O2, O5 dead. O1, O3, O4 copied to S0, age 1. Eden wiped",
              "minor GC 2: O4, O6 dead. survivors copied to S1, ages go up. S0 wiped",
              "minor GC 3: O1 and O3 reach age 3 (the threshold): promoted to old",
              "default threshold 15. the old generation is collected by a major GC",
            ][Math.min(t.step, 5)]
          }
        </div>
        {fresh.length > 0 && <div style={{ fontSize: 24, color: C.muted, marginTop: 8 }}>(O6 and O7 were created in Eden before this GC)</div>}
      </Abs>
      {t.step >= 5 && (
        <Abs x={160} y={700} w={1610} style={{ display: "flex", gap: 16, flexWrap: "wrap", ...rise(f, at(t, 5) + 20) }}>
          <Chip color={C.pink} style={{ fontSize: 24 }}>survivor space too small → premature promotion</Chip>
          <Chip color={C.amber} style={{ fontSize: 24 }}>-XX:MaxTenuringThreshold (max 15)</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ mark, sweep, compact

export const Compact = ({ t }: CP) => {
  const f = t.frame;
  const cells = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1];
  const live = cells.reduce((s, c) => s + c, 0);
  const slide = t.step >= 2 ? ease(f, at(t, 2) + 20, 40) : 0;
  const liveIdx = cells.map((c, i) => (c ? i : -1)).filter((i) => i >= 0);
  return (
    <>
      <Abs x={160} y={260} w={1600} style={{ fontSize: 30, fontWeight: 800, ...rise(f, 4) }}>
        {["1. mark: everything reachable from the roots", "2. sweep: free everything unmarked", "3. compact: slide the survivors together"][Math.min(t.step, 2)]}
      </Abs>
      {cells.map((c, i) => {
        const dead = !c;
        const swept = t.step >= 1 && dead;
        const target = c ? liveIdx.indexOf(i) : i;
        const x = 160 + lerp(i, target, c ? slide : 0) * 130;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: 380, width: 110, height: 110, borderRadius: 14, border: `3px ${swept ? "dashed" : "solid"} ${c ? C.green : swept ? C.line : C.red}`, background: c ? `${C.green}33` : swept ? "transparent" : `${C.red}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: C.text, opacity: Math.min(1, pop(f, 6 + i * 3)), visibility: slide > 0 && dead ? "hidden" : "visible" }}>
            {c ? "live" : swept ? "" : "dead"}
          </div>
        );
      })}
      {t.step === 1 && (
        <Abs x={160} y={540} w={1600} style={{ fontSize: 28, color: C.amber, ...rise(f, at(t, 1) + 20) }}>
          free space is now scattered holes: a big array may not fit in any of them (fragmentation)
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={160 + live * 130} y={540} w={800} style={{ fontSize: 28, color: C.cyan, ...rise(f, at(t, 2) + 60) }}>
          ← one free block
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={160} y={680} w={1600} style={{ ...rise(f, at(t, 3)) }}>
          <Chip color={C.purple} style={{ fontSize: 26 }}>the young generation copies instead: live objects out, whole space wiped</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ PermGen vs Metaspace

export const Meta = ({ t }: CP) => {
  const f = t.frame;
  const grow = ease(f, 30, 120);
  return (
    <>
      <Abs x={160} y={270} w={700} style={{ ...rise(f, 4) }}>
        <div style={{ fontSize: 30, fontWeight: 800 }}>PermGen (up to Java 7)</div>
        <div style={{ ...card(C.red), padding: "60px 20px", marginTop: 14, textAlign: "center", fontSize: 26 }}>fixed size, inside the heap</div>
        <div style={{ fontFamily: MONO, fontSize: 24, color: C.red, marginTop: 14 }}>OutOfMemoryError: PermGen space</div>
      </Abs>
      <Abs x={1000} y={270} w={760} style={{ ...rise(f, 20) }}>
        <div style={{ fontSize: 30, fontWeight: 800 }}>Metaspace (Java 8+)</div>
        <div style={{ ...card(C.purple), marginTop: 14, padding: "20px", textAlign: "center", fontSize: 26, width: `${lerp(50, 100, grow)}%` }}>
          native memory, grows as classes load
        </div>
        <div style={{ fontSize: 24, color: C.muted, marginTop: 14 }}>class metadata, method bytecode, constant pool</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={160} y={700} w={1600} style={{ display: "flex", gap: 16, flexWrap: "wrap", ...rise(f, at(t, 1)) }}>
          <Chip color={C.amber} style={{ fontSize: 24 }}>static fields and the String pool live on the heap</Chip>
          <Chip color={C.red} style={{ fontSize: 24 }}>a leaked class loader → OutOfMemoryError: Metaspace</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ collectors on a timeline

export const Collectors = ({ t }: CP) => {
  const f = t.frame;
  const lanes: { name: string; step: number; col: string; pauses: [number, number][]; note: string }[] = [
    { name: "Serial", step: 1, col: C.red, pauses: [[300, 560]], note: "one GC thread, long stop-the-world pause" },
    { name: "Parallel", step: 2, col: C.amber, pauses: [[300, 400]], note: "many GC threads: best throughput, still stops the world" },
    { name: "G1", step: 3, col: C.blue, pauses: [[250, 285], [500, 535], [760, 795]], note: "short pauses aimed at 200 ms, regions, compacts" },
    { name: "ZGC", step: 4, col: C.green, pauses: [[300, 304], [600, 604], [900, 904]], note: "almost all work concurrent: pauses under ~1 ms" },
  ];
  return (
    <>
      <Abs x={160} y={250} w={1600} style={{ fontSize: 28, ...rise(f, 4) }}>
        app threads running · <span style={{ color: C.red, fontWeight: 800 }}>stop-the-world pause</span>
      </Abs>
      {lanes.map((l, i) =>
        t.step >= l.step ? (
          <Abs key={l.name} x={160} y={320 + i * 120} w={1600} style={{ ...rise(f, at(t, l.step)) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 160, fontSize: 30, fontWeight: 800, color: l.col }}>{l.name}</div>
              <div style={{ position: "relative", width: 1000, height: 36, borderRadius: 8, background: `${C.green}44` }}>
                {l.pauses.map(([a, b], k) => (
                  <div key={k} style={{ position: "absolute", left: a, width: Math.max(4, (b - a) * ease(f, at(t, l.step) + 10, 20)), top: 0, height: 36, background: C.red, borderRadius: 4 }} />
                ))}
              </div>
            </div>
            <div style={{ fontSize: 22, color: C.muted, marginLeft: 180, marginTop: 6 }}>{l.note}</div>
          </Abs>
        ) : null,
      )}
      {t.step >= 5 && (
        <Abs x={160} y={820} w={1600} style={{ display: "flex", gap: 14, flexWrap: "wrap", ...rise(f, at(t, 5)) }}>
          <Chip color={C.blue} style={{ fontSize: 24 }}>default: G1 (Java 9+)</Chip>
          <Chip color={C.amber} style={{ fontSize: 24 }}>batch: Parallel</Chip>
          <Chip color={C.green} style={{ fontSize: 24 }}>strict latency: ZGC</Chip>
          <Chip color={C.red} style={{ fontSize: 24 }}>CMS: removed in Java 14</Chip>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ G1 regions

export const Regions = ({ t }: CP) => {
  const f = t.frame;
  const kinds = "EOEFSOOFEHHOFEOSFOEFOOEF";
  const col: Record<string, string> = { E: C.green, S: C.pink, O: C.amber, H: C.purple, F: C.line };
  const name: Record<string, string> = { E: "Eden", S: "Surv", O: "Old", H: "Hum", F: "" };
  const garbage: Record<number, number> = { 1: 90, 6: 70, 11: 85, 21: 95 };
  const pick = t.step >= 1 ? ease(f, at(t, 1) + 20, 30) : 0;
  const chosen = new Set([1, 11, 21]);
  return (
    <>
      {kinds.split("").map((k, i) => {
        const x = 160 + (i % 8) * 200;
        const y = 270 + Math.floor(i / 8) * 150;
        const take = chosen.has(i) && pick > 0.5;
        return (
          <Abs key={i} x={x} y={y} w={180} style={{ border: `3px ${k === "F" || take ? "dashed" : "solid"} ${take ? C.line : col[k]}`, borderRadius: 12, padding: "16px 0", textAlign: "center", background: take ? "transparent" : `${col[k]}22`, opacity: Math.min(1, pop(f, 4 + i * 2)) }}>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{take ? "freed" : name[k] || "free"}</div>
            {garbage[i] !== undefined && !take && <div style={{ fontSize: 20, color: garbage[i] >= 85 ? C.red : C.muted }}>{garbage[i]}% garbage</div>}
          </Abs>
        );
      })}
      {t.step >= 1 && (
        <Abs x={160} y={760} w={1600} style={{ fontSize: 28, ...rise(f, at(t, 1) + 40) }}>
          garbage first: the fullest-of-garbage regions are collected, live objects copied into free regions
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ a leak: a static map that only grows

export const Leak = ({ t }: CP) => {
  const f = t.frame;
  const n = t.step >= 0 ? Math.min(24, Math.floor((f - 20) / 8)) : 0;
  return (
    <>
      <Abs x={160} y={260} w={760} style={{ ...card(), padding: "18px 24px", fontFamily: MONO, fontSize: 24, lineHeight: 1.6, ...rise(f, 4) }}>
        static Map&lt;String, Session&gt; SESSIONS
        <br />
        login(): SESSIONS.put(id, s);
        <br />
        <span style={{ color: t.step >= 3 ? C.green : C.red }}>{t.step >= 3 ? "logout(): SESSIONS.remove(id);" : "logout(): (nothing)"}</span>
      </Abs>
      <Abs x={1000} y={260} w={760} style={{ ...card(C.amber), padding: "16px 20px", ...rise(f, 10) }}>
        <div style={{ fontSize: 24, color: C.muted }}>GC root: static field → SESSIONS</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {Array.from({ length: t.step >= 3 ? 4 : n }, (_, i) => (
            <div key={i} style={{ width: 40, height: 30, borderRadius: 6, background: C.amber }} />
          ))}
        </div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={160} y={520} w={1600} style={{ fontSize: 28, ...rise(f, at(t, 1)) }}>
          every session ever created is still reachable, so the GC can never free it. the floor after each GC keeps rising.
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={160} y={620} w={1600} style={{ display: "flex", gap: 14, flexWrap: "wrap", ...rise(f, at(t, 2)) }}>
          <Chip color={C.blue} style={{ fontSize: 24 }}>-XX:+HeapDumpOnOutOfMemoryError</Chip>
          <Chip color={C.blue} style={{ fontSize: 24 }}>jcmd &lt;pid&gt; GC.heap_dump</Chip>
          <Chip color={C.purple} style={{ fontSize: 24 }}>Eclipse MAT: leak suspect = SESSIONS</Chip>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={160} y={740} w={1600} style={{ ...rise(f, at(t, 3)) }}>
          <Big size={36} color={C.green}>fix: remove on logout, and bound it (LRU, or a cache with expiry)</Big>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the JVM inside a 1 GiB pod

export const Pod = ({ t }: CP) => {
  const f = t.frame;
  const W = 1200;
  const bars: { step: number; label: string; parts: [string, number, string][]; verdict: string; vcol: string }[] = [
    { step: 0, label: "no flags", parts: [["heap 256 MB (25%)", 0.25, C.blue]], verdict: "OutOfMemoryError, with most of the pod unused", vcol: C.red },
    { step: 1, label: "-Xmx1g", parts: [["heap 1 GiB", 1, C.blue], ["non-heap", 0.18, C.purple]], verdict: "over the limit: OOMKilled, exit code 137", vcol: C.red },
    { step: 2, label: "MaxRAMPercentage=75", parts: [["heap ~768 MB", 0.75, C.blue], ["non-heap", 0.18, C.purple]], verdict: "fits, with room for non-heap memory", vcol: C.green },
  ];
  return (
    <>
      <Abs x={160} y={250} w={1600} style={{ fontSize: 28, ...rise(f, 4) }}>a Kubernetes pod with a 1 GiB memory limit</Abs>
      <Svg>
        <line x1={160 + W} y1={300} x2={160 + W} y2={850} stroke={C.red} strokeWidth={4} strokeDasharray="12 8" />
      </Svg>
      <Abs x={160 + W + 10} y={300} w={300} style={{ fontFamily: MONO, fontSize: 22, color: C.red }}>pod limit 1 GiB</Abs>
      {bars.map((b, i) =>
        t.step >= b.step ? (
          <Abs key={b.label} x={160} y={350 + i * 170} w={1600} style={{ ...rise(f, at(t, b.step)) }}>
            <div style={{ fontFamily: MONO, fontSize: 24, marginBottom: 8 }}>{b.label}</div>
            <div style={{ display: "flex" }}>
              {b.parts.map(([n, w, col]) => (
                <div key={n} style={{ width: W * w * ease(f, at(t, b.step) + 10, 30), background: `${col}55`, border: `2px solid ${col}`, borderRadius: 6, overflow: "hidden", whiteSpace: "nowrap", fontSize: 20, padding: "12px 10px" }}>
                  {n}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 24, color: b.vcol, marginTop: 8, fontWeight: 700 }}>{b.verdict}</div>
          </Abs>
        ) : null,
      )}
    </>
  );
};

// ------------------------------------------------------------------ the recall task

export const DrawHeap = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      <Abs x={260} y={320} w={1400} style={{ textAlign: "center", ...rise(f, 4) }}>
        <div style={{ fontSize: 100 }}>✏️</div>
        <Big size={50} style={{ marginTop: 10 }}>from memory: draw Eden, S0, S1 and old</Big>
      </Abs>
      {t.step >= 1 && (
        <Abs x={260} y={620} w={1400} style={{ textAlign: "center", ...rise(f, at(t, 1)) }}>
          <Big size={38} color={C.amber}>then walk five objects through three minor GCs, threshold 3, writing every age</Big>
        </Abs>
      )}
    </>
  );
};
