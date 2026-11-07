// Chapter 4 (When retrieval still fails), told with a general example: a
// company knowledge assistant over policies, runbooks and PDFs.
import { C, MONO, PALETTE } from "../lib/theme.ts";
import { ease, enter, rise } from "../lib/anim.ts";
import { Abs, card, Chip } from "./ui.tsx";
import { at, during } from "./custom3.tsx";
import { Svg, type CP } from "./secui.tsx";

// ------------------------------------------------------------------ hook

export const A4Hook = ({ t }: CP) => {
  const f = t.frame;
  const items: [string, string, string][] = [
    ["“it broke after the update, what changed?”", "nothing useful to search with", "❓"],
    ["“and in Germany?”", "means nothing on its own", "↩️"],
    ["right policy found · answer says 16 weeks", "the policy says 26", "🎯"],
    ["UK 26 DE 14 FR 16 Notes Notes Page 7 Page 7", "a PDF table, after parsing", "📄"],
  ];
  return (
    <>
      <Abs x={80} y={170} w={1220} style={{ fontSize: 44, fontWeight: 800, ...rise(f, 2) }}>
        Search is fast and precise. Answers still fail.
      </Abs>
      <Abs x={80} y={280} w={1760} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {items.map(([a, b, icon], i) => {
          if (t.step < i) return null;
          return (
            <div key={i} style={{ ...card(t.step === i ? C.red : C.line), padding: "16px 26px", display: "flex", alignItems: "center", gap: 24, ...rise(f, at(t, i)) }}>
              <div style={{ fontSize: 46 }}>{icon}</div>
              <div style={{ fontFamily: i === 3 ? MONO : undefined, fontSize: 32, fontWeight: 700, flex: 1 }}>{a}</div>
              <div style={{ fontSize: 26, color: C.red, fontWeight: 700 }}>{b}</div>
            </div>
          );
        })}
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ multi-query

export const A4Multi = ({ t }: CP) => {
  const f = t.frame;
  const qs = ["app crashes after version 4.2 update", "login error since the latest release", "what changed in release 4.2?"];
  return (
    <>
      <Abs x={80} y={190} w={760} style={{ ...card(C.amber), padding: "22px 28px", ...rise(f, 4) }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>USER</div>
        <div style={{ fontSize: 34, fontWeight: 700, marginTop: 6 }}>“it keeps failing after the update, what changed?”</div>
      </Abs>
      {t.step >= 1 &&
        qs.map((q, i) => (
          <Abs key={q} x={940} y={270 + i * 110} w={900} style={{ ...card(C.blue), padding: "16px 24px", fontSize: 30, fontWeight: 700, ...rise(f, at(t, 1) + i * 12) }}>
            {i + 1}. {q}
          </Abs>
        ))}
      {t.step >= 1 && (
        <Svg>
          {qs.map((_, i) => (
            <line key={i} x1={840} y1={280} x2={936} y2={305 + i * 110} stroke={C.blue} strokeWidth={3} opacity={enter(f, at(t, 1) + i * 12)} />
          ))}
        </Svg>
      )}
      {t.step >= 2 && (
        <Abs x={940} y={620} w={900} style={{ display: "flex", gap: 16, alignItems: "center", ...rise(f, at(t, 2)) }}>
          <Chip color={C.purple} style={{ fontSize: 28 }}>3 searches</Chip>
          <div style={{ fontSize: 34, color: C.faint }}>→</div>
          <Chip color={C.purple} style={{ fontSize: 28 }}>merge with RRF</Chip>
          <div style={{ fontSize: 34, color: C.faint }}>→</div>
          <Chip color={C.green} style={{ fontSize: 28 }}>release notes 4.2 ✓</Chip>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={740} w={1760} style={{ fontSize: 30, color: C.muted, fontWeight: 700, ...rise(f, at(t, 3)) }}>
          one extra model call before search · more latency, more cost · use it where tests show vague questions fail
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ HyDE

export const A4Hyde = ({ t }: CP) => {
  const f = t.frame;
  const M = { x: 980, y: 290, w: 840, h: 540 };
  const P = (x: number, y: number) => ({ x: M.x + x * M.w, y: M.y + y * M.h });
  const answers = [
    [0.7, 0.3],
    [0.78, 0.42],
    [0.66, 0.5],
  ];
  const q = P(0.18, 0.75);
  const fake = P(0.72, 0.38);
  return (
    <>
      <Abs x={80} y={200} w={820} style={{ ...card(), padding: "18px 24px", ...rise(f, 4) }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>QUESTION · SHORT</div>
        <div style={{ fontSize: 30, fontWeight: 700, marginTop: 6 }}>how long do refunds take?</div>
      </Abs>
      {t.step >= 1 && (
        <Abs x={80} y={360} w={820} style={{ ...card(C.purple), padding: "18px 24px", ...rise(f, at(t, 1)) }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.purple, letterSpacing: 2 }}>FAKE ANSWER, WRITTEN BY A MODEL</div>
          <div style={{ fontSize: 27, marginTop: 6, lineHeight: 1.35 }}>Refunds are usually processed within 5–10 business days after the request is approved, and appear on the original payment method…</div>
        </Abs>
      )}
      {t.step >= 3 && (
        <Abs x={80} y={640} w={820} style={{ ...card(C.red), padding: "16px 24px", fontSize: 27, ...rise(f, at(t, 3)) }}>
          ⚠ a confidently wrong fake answer pulls in the wrong documents
        </Abs>
      )}
      <Svg>
        <rect x={M.x} y={M.y} width={M.w} height={M.h} rx={20} fill={C.card} stroke={C.line} strokeWidth={2} opacity={enter(f, 6)} />
        {answers.map(([x, y], i) => (
          <circle key={i} cx={P(x, y).x} cy={P(x, y).y} r={12} fill={C.green} opacity={enter(f, 8 + i * 4)} />
        ))}
        <circle cx={q.x} cy={q.y} r={12} fill={C.blue} opacity={enter(f, 14)} />
        {t.step >= 2 && <circle cx={fake.x} cy={fake.y} r={14} fill={C.purple} opacity={enter(f, at(t, 2))} />}
        {t.step >= 2 && <circle cx={fake.x} cy={fake.y} r={110 * ease(f, at(t, 2) + 10, 20)} fill="none" stroke={C.purple} strokeWidth={3} strokeDasharray="8 8" />}
      </Svg>
      <Abs x={q.x - 100} y={q.y + 20} w={200} style={{ textAlign: "center", fontSize: 24, color: C.blue, fontWeight: 700, opacity: enter(f, 14) }}>
        question
      </Abs>
      <Abs x={P(0.62, 0.12).x} y={P(0.62, 0.12).y} w={300} style={{ fontSize: 24, color: C.green, fontWeight: 700, opacity: enter(f, 10) }}>
        real answer paragraphs
      </Abs>
      {t.step >= 2 && (
        <Abs x={fake.x - 150} y={fake.y + 120} w={300} style={{ textAlign: "center", fontSize: 24, color: C.purple, fontWeight: 700, ...rise(f, at(t, 2)) }}>
          fake answer lands among them
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ condensing

export const A4Condense = ({ t }: CP) => {
  const f = t.frame;
  return (
    <>
      <Abs x={80} y={190} w={1000} style={{ ...card(), background: C.bg2, padding: "24px 30px", display: "flex", flexDirection: "column", gap: 16, ...rise(f, 4) }}>
        {[
          ["user", "What's the parental leave policy in the UK?"],
          ["bot", "26 weeks, fully paid, for the primary carer. [hb:4.2]"],
          ["user", "And in Germany?"],
        ].map(([who, txt], i) => (
          <div key={i} style={{ alignSelf: who === "user" ? "flex-end" : "flex-start", maxWidth: 760, background: who === "user" ? C.blue : C.card2, color: who === "user" ? "#06101f" : C.text, borderRadius: 22, padding: "12px 22px", fontSize: 29, fontWeight: who === "user" ? 600 : 500, opacity: enter(f, 6 + i * 10) }}>
            {txt}
          </div>
        ))}
      </Abs>
      {t.step === 0 && (
        <Abs x={1140} y={260} w={700} style={{ ...card(C.red), padding: "20px 26px", ...rise(f, 30) }}>
          <div style={{ fontFamily: MONO, fontSize: 28 }}>search(“And in Germany?”)</div>
          <div style={{ fontSize: 28, color: C.red, fontWeight: 800, marginTop: 8 }}>→ nothing relevant</div>
        </Abs>
      )}
      {t.step >= 1 && (
        <Abs x={1140} y={260} w={700} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...card(C.purple), padding: "16px 22px", fontSize: 26, ...rise(f, at(t, 1)) }}>
            <b>condense:</b> chat history + latest message → one standalone question
          </div>
          <div style={{ ...card(C.green), padding: "16px 22px", fontSize: 30, fontWeight: 700, ...rise(f, at(t, 1) + 20) }}>“What is the parental leave policy in Germany?”</div>
          <div style={{ fontSize: 28, color: C.green, fontWeight: 800, ...rise(f, at(t, 1) + 36) }}>→ search finds §4.3 Germany ✓</div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={80} y={620} w={1760} style={{ fontSize: 29, color: C.muted, fontWeight: 700, lineHeight: 1.45, ...rise(f, at(t, 2)) }}>
          search uses the standalone question · the answer still sees the chat (“unlike the UK, Germany…”)
          <br />
          skip the call when the message already stands alone: it adds latency to every turn
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ self-query

export const A4SelfQuery = ({ t }: CP) => {
  const f = t.frame;
  const parts: [string, string, string][] = [
    ["query", "“outages”", C.blue],
    ["city", "= Berlin", C.amber],
    ["type", "= incident", C.amber],
    ["date", "≥ 7 days ago", C.amber],
  ];
  return (
    <>
      <Abs x={80} y={200} w={1220} style={{ ...card(), padding: "20px 28px", fontSize: 36, fontWeight: 700, ...rise(f, 4) }}>
        “<span style={{ color: C.amber }}>Berlin</span> <span style={{ color: C.amber }}>incident reports</span> from <span style={{ color: C.amber }}>last week</span> about <span style={{ color: C.blue }}>outages</span>”
      </Abs>
      <Abs x={80} y={360} w={1220} style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {t.step >= 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {parts.map(([k, v, col], i) => (
              <div key={k} style={{ ...card(col), padding: "14px 22px", fontFamily: MONO, fontSize: 30, ...rise(f, at(t, 1) + i * 10) }}>
                <span style={{ color: col }}>{k}</span> {v}
              </div>
            ))}
          </div>
        )}
        {t.step >= 1 && (
          <div style={{ fontSize: 30, fontWeight: 700, ...rise(f, at(t, 1) + 40) }}>
            <span style={{ color: C.amber }}>filters</span> run exactly · <span style={{ color: C.blue }}>meaning</span> ranks what's left
          </div>
        )}
        {t.step >= 2 && (
          <div style={{ ...card(C.red), padding: "18px 26px", fontSize: 29, lineHeight: 1.4, ...rise(f, at(t, 2)) }}>
            validate every generated filter against the allowed fields · models invent fields · and a filter must never widen what the user may see
          </div>
        )}
      </Abs>
    </>
  );
};

// ------------------------------------------------------------------ trace

export const A4Trace = ({ t }: CP) => {
  const f = t.frame;
  const stages: [string, string, boolean][] = [
    ["question", "how much parental leave in the UK?", false],
    ["search query", "UK parental leave policy weeks", false],
    ["retrieved (top 5)", "hb-2026:4.2 · 0.86 | hb-2023:4.2 · 0.85 | faq:17 · 0.71 …", false],
    ["reranked", "hb-2026:4.2 · hb-2023:4.2 · faq:17", false],
    ["final prompt", "…26 weeks (2026) … 16 weeks (2023) …", true],
    ["answer", "“16 weeks”", true],
  ];
  const back = t.step >= 1 ? Math.min(stages.length, Math.floor(ease(f, at(t, 1), 60) * stages.length) + 1) : 0;
  return (
    <>
      <Abs x={80} y={180} w={1220} style={{ fontSize: 30, fontWeight: 800, color: C.muted, ...rise(f, 2) }}>
        TRACE · one question's whole journey
      </Abs>
      <Abs x={80} y={240} w={1220} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {stages.map(([name, val, bad], i) => {
          const checked = stages.length - i <= back;
          const hit = t.step >= 2 && bad && i === 4;
          return (
            <div key={name} style={{ ...card(hit ? C.red : checked ? C.green : C.line), padding: "12px 22px", display: "flex", gap: 20, alignItems: "baseline", opacity: enter(f, 6 + i * 5) }}>
              <div style={{ width: 230, fontSize: 24, fontWeight: 800, color: C.muted }}>{name}</div>
              <div style={{ fontFamily: MONO, fontSize: 24, flex: 1 }}>{val}</div>
              {checked && !hit && t.step >= 1 && <div style={{ color: C.green, fontWeight: 900, fontSize: 26 }}>✓</div>}
              {hit && <div style={{ color: C.red, fontWeight: 900, fontSize: 26 }}>✗</div>}
            </div>
          );
        })}
      </Abs>
      {t.step >= 1 && (
        <Abs x={1360} y={300} w={480} style={{ fontSize: 30, fontWeight: 800, color: C.green, ...rise(f, at(t, 1)) }}>
          ↑ walk backwards from the answer, checking each step
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={1360} y={460} w={480} style={{ ...card(C.red), padding: "18px 24px", fontSize: 27, lineHeight: 1.35, ...rise(f, at(t, 2)) }}>
          the prompt held two versions: 2026 says 26 weeks, a never-deleted 2023 copy says 16
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ PDF parsing

export const A4Pdf = ({ t }: CP) => {
  const f = t.frame;
  const line = (w: number, k: number) => <div key={k} style={{ height: 8, width: `${w}%`, background: "#c3cbdb", borderRadius: 4, marginTop: 9 }} />;
  return (
    <>
      <Abs x={80} y={200} w={520} h={640} style={{ background: "#eef2f8", borderRadius: 10, padding: 26, boxShadow: "0 18px 50px rgba(0,0,0,0.4)", ...rise(f, 4) }}>
        <div style={{ height: 16, width: "60%", background: "#5b6b88", borderRadius: 4 }} />
        <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
          <div style={{ flex: 1 }}>{[90, 100, 85, 95, 70].map(line)}</div>
          <div style={{ flex: 1 }}>{[95, 80, 100, 90, 60].map(line)}</div>
        </div>
        <div style={{ marginTop: 20, border: "2px solid #8a97b0", borderRadius: 6 }}>
          {[
            ["Country", "Weeks"],
            ["UK", "26"],
            ["DE", "14"],
            ["FR", "16"],
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", borderTop: i ? "1px solid #b8c1d3" : undefined, fontSize: 22, color: "#1d2638", fontWeight: i === 0 ? 800 : 500 }}>
              <div style={{ flex: 1, padding: "4px 10px" }}>{r[0]}</div>
              <div style={{ flex: 1, padding: "4px 10px" }}>{r[1]}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
          <div style={{ flex: 1 }}>{[100, 80].map(line)}</div>
          <div style={{ flex: 1 }}>{[90, 70].map(line)}</div>
        </div>
        <div style={{ position: "absolute", bottom: 16, left: 26, fontSize: 16, color: "#7a869e" }}>Company Confidential · Page 7</div>
      </Abs>
      <Abs x={660} y={200} w={1180} style={{ ...card(C.red), padding: "18px 24px", ...rise(f, at(t, 0) + 20) }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.red, letterSpacing: 2 }}>NAIVE TEXT EXTRACTION</div>
        <div style={{ fontFamily: MONO, fontSize: 24, marginTop: 10, lineHeight: 1.4, color: C.muted }}>Parental leave applies to all Eligibility for the leave employees who have completed starts from the first day… Country Weeks UK 26 DE 14 FR 16 Company Confidential · Page 7 Company Confidential · Page 7</div>
      </Abs>
      {t.step >= 2 && (
        <Abs x={660} y={470} w={1180} style={{ ...card(C.green), padding: "18px 24px", ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.green, letterSpacing: 2 }}>LAYOUT-AWARE PARSE → MARKDOWN</div>
          <div style={{ fontFamily: MONO, fontSize: 24, marginTop: 10, lineHeight: 1.4, whiteSpace: "pre" }}>{"## Parental leave\nParental leave applies to all employees who…\n\n| Country | Weeks |\n| UK      | 26    |\n| DE      | 14    |"}</div>
        </Abs>
      )}
      {t.step === 1 && (
        <Abs x={660} y={470} w={1180} style={{ display: "flex", flexWrap: "wrap", gap: 14, opacity: during(t, 1) }}>
          {["columns interleaved", "table flattened", "footer repeated 40×", "scans need OCR: “24h” → “2411”"].map((s, i) => (
            <Chip key={s} color={C.red} style={{ fontSize: 28, opacity: enter(f, at(t, 1) + i * 10) }}>
              ✗ {s}
            </Chip>
          ))}
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ tables

export const A4Table = ({ t }: CP) => {
  const f = t.frame;
  const rows = [
    ["UK", "26", "full pay"],
    ["Germany", "14", "statutory pay"],
    ["France", "16", "statutory pay"],
  ];
  return (
    <>
      <Abs x={80} y={200} w={560} style={{ ...card(), padding: "18px 22px", ...rise(f, 4) }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>THE TABLE</div>
        {[["Country", "Weeks", "Pay"], ...rows].map((r, i) => (
          <div key={i} style={{ display: "flex", fontFamily: MONO, fontSize: 26, marginTop: 8, fontWeight: i === 0 ? 800 : 500, color: i === 0 ? C.amber : C.text }}>
            {r.map((c, k) => (
              <div key={k} style={{ flex: k === 2 ? 1.6 : 1 }}>
                {c}
              </div>
            ))}
          </div>
        ))}
      </Abs>
      {t.step >= 1 && (
        <Abs x={700} y={200} w={1140} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ ...card(PALETTE[i]), padding: "12px 20px", fontFamily: MONO, fontSize: 25, ...rise(f, at(t, 1) + i * 10) }}>
              Parental leave · Country: {r[0]} · Weeks: {r[1]} · Pay: {r[2]}
            </div>
          ))}
          <div style={{ ...card(C.green), padding: "12px 20px", fontSize: 25, ...rise(f, at(t, 1) + 40) }}>
            summary chunk: “Parental leave by country: UK longest at 26 weeks…”
          </div>
        </Abs>
      )}
      {t.step >= 2 && (
        <Abs x={80} y={600} w={1760} style={{ ...card(C.amber), padding: "18px 26px", display: "flex", alignItems: "center", gap: 24, ...rise(f, at(t, 2)) }}>
          <div style={{ fontSize: 46 }}>🗄️</div>
          <div style={{ fontSize: 30, fontWeight: 700 }}>a 5,000-row price list? Don't chunk it: load it into a database and answer with SQL</div>
        </Abs>
      )}
    </>
  );
};

// ------------------------------------------------------------------ GraphRAG

const ENT: [string, number, number, number][] = [
  ["Acme Corp", 0.2, 0.3, 0],
  ["Vendor A", 0.08, 0.6, 0],
  ["Vendor B", 0.32, 0.65, 0],
  ["Incident 12", 0.18, 0.88, 0],
  ["Billing", 0.62, 0.22, 1],
  ["Refund delays", 0.78, 0.38, 1],
  ["Invoice errors", 0.6, 0.5, 1],
  ["Login", 0.85, 0.75, 2],
  ["Token expiry", 0.66, 0.85, 2],
];
const REL: [number, number][] = [
  [0, 1],
  [0, 2],
  [2, 3],
  [4, 5],
  [4, 6],
  [5, 6],
  [7, 8],
  [6, 0],
];

export const A4Graph = ({ t }: CP) => {
  const f = t.frame;
  const M = { x: 80, y: 260, w: 1120, h: 560 };
  const P = (i: number) => ({ x: M.x + ENT[i][1] * M.w, y: M.y + ENT[i][2] * M.h });
  const comm = t.step >= 2;
  const hop = t.step === 1 ? ease(f, at(t, 1) + 10, 40) : 0;
  const cols = [C.blue, C.amber, C.purple];
  return (
    <>
      <Svg>
        {REL.map(([a, b], i) => {
          const on = t.step === 1 && ((a === 0 && b === 2) || (a === 2 && b === 3));
          return <line key={i} x1={P(a).x} y1={P(a).y} x2={P(b).x} y2={P(b).y} stroke={on ? C.green : C.faint} strokeWidth={on ? 6 * hop + 2 : 2} opacity={enter(f, 10 + i * 3)} />;
        })}
        {comm &&
          [0, 1, 2].map((c) => {
            const ids = ENT.map((e, i) => (e[3] === c ? i : -1)).filter((i) => i >= 0);
            const cx = ids.reduce((s, i) => s + P(i).x, 0) / ids.length;
            const cy = ids.reduce((s, i) => s + P(i).y, 0) / ids.length;
            return <circle key={c} cx={cx} cy={cy} r={200 * ease(f, at(t, 2) + c * 8, 24)} fill={`${cols[c]}14`} stroke={cols[c]} strokeWidth={2} strokeDasharray="8 8" />;
          })}
      </Svg>
      {ENT.map(([name], i) => (
        <Abs key={name} x={P(i).x - 100} y={P(i).y - 20} w={200} style={{ textAlign: "center", opacity: enter(f, 6 + i * 3) }}>
          <span style={{ background: C.card, border: `2px solid ${comm ? cols[ENT[i][3]] : C.line}`, borderRadius: 10, padding: "4px 12px", fontSize: 22, fontWeight: 700, whiteSpace: "nowrap" }}>{name}</span>
        </Abs>
      ))}
      <Abs x={1260} y={270} w={580} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ ...card(C.purple), padding: "14px 20px", fontSize: 26, ...rise(f, 8) }}>
          an LLM extracts <b>entities</b> and <b>relationships</b> from every document
        </div>
        {t.step >= 1 && (
          <div style={{ ...card(C.green), padding: "14px 20px", fontSize: 26, ...rise(f, at(t, 1)) }}>
            multi-hop: “which vendors of Acme had incidents?” → follow the links
          </div>
        )}
        {t.step >= 2 && (
          <div style={{ ...card(C.amber), padding: "14px 20px", fontSize: 26, ...rise(f, at(t, 2)) }}>
            communities, each summarised → “main complaint themes?” answered from summaries
          </div>
        )}
        {t.step >= 3 && (
          <div style={{ ...card(C.red), padding: "14px 20px", fontSize: 26, ...rise(f, at(t, 3)) }}>
            slow and costly to build, hard to update: use it when those questions matter
          </div>
        )}
      </Abs>
    </>
  );
};

