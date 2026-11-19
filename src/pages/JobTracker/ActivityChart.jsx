import React, { useMemo, useState } from "react";
import { HiCheck } from "react-icons/hi";
import { GLASS_TRACK, SEGMENT_ON, SEGMENT_OFF } from "../../components/glass";
import { dayKey, lastDays, todayKey } from "./shared";

// Daily activity under the pipeline. Today comes first: how far you are
// against each day's targets (50 applications, 10 referral asks, 10 recruiter
// messages), as counts with progress bars. Below, the history as two line
// charts: applications against 50, and referrals and outreach against 10 —
// two charts, not one with two scales, as the counts are an order apart.
// Days run 4am–4am IST (dayKey). The numbers come from the ledger
// (withLedger), so jobs erased or removed since still count.

const RANGES = [7, 30, 90];
const TARGET = { applied: 50, referral: 10, outreach: 10 };

// Applications in the page's Applied green; referrals violet and outreach
// orange (validated as a pair in light and dark).
const SERIES = {
  applied: { label: "Applications", stroke: "var(--success)", bg: "bg-success" },
  referral: { label: "Referral asks", stroke: "var(--brand)", bg: "bg-brand" },
  outreach: { label: "Recruiters messaged", stroke: "#ea580c", bg: "bg-[#ea580c]" },
};

// From the day key, so 1am IST still shows the day it belongs to.
const fmtDay = (key) => new Date(`${key}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

// ── Today ────────────────────────────────────────────────────────────────────
function TodayTile({ kind, value }) {
  const s = SERIES[kind];
  const target = TARGET[kind];
  const done = value >= target;
  const left = target - value;
  return (
    <div className="bg-canvas border border-line rounded-lg p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-fg-muted">
        <span aria-hidden className={`w-2 h-2 rounded-full ${s.bg}`} />
        {s.label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5 tabular-nums">
        <span className="font-mono text-[34px] leading-10 font-semibold text-fg">{value}</span>
        <span className="font-mono text-lg text-fg-subtle">/ {target}</span>
      </div>
      <div
        className="mt-2 h-2 rounded-full bg-surface-hover overflow-hidden"
        role="progressbar"
        aria-label={`${s.label} today`}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={target}
      >
        <div className={`h-full rounded-full ${s.bg} transition-[width] duration-500`} style={{ width: `${Math.min(100, (value / target) * 100)}%` }} />
      </div>
      <p className={`mt-2 text-xs ${done ? "text-success-fg font-semibold" : "text-fg-subtle"}`}>
        {done ? (
          <span className="inline-flex items-center gap-1">
            <HiCheck className="w-3.5 h-3.5" /> Target hit{value > target ? ` (+${value - target})` : ""}
          </span>
        ) : (
          `${left} to go · ${Math.round((value / target) * 100)}%`
        )}
      </p>
    </div>
  );
}

// ── History ──────────────────────────────────────────────────────────────────
// Lines over the days (one per series), a dashed target line, a crosshair and
// dots on the hovered day, and sparse dates below. Hovering anywhere over the
// plot picks the nearest day.
function Lines({ days, series, max, target, hover, setHover, label }) {
  const n = days.length;
  const x = (i) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v) => 100 - (Math.min(v, max) / max) * 100;
  const pick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };
  const at = hover ?? n - 1; // no hover: today
  const ticks = [...new Set([0, Math.floor((n - 1) / 2), n - 1])];
  return (
    <div>
      <div className="relative h-32 cursor-crosshair" role="img" aria-label={label} onMouseMove={pick} onMouseLeave={() => setHover(null)}>
        <div className="absolute inset-x-0 bottom-0 border-t border-line" />
        <div className="absolute inset-x-0 border-t border-dashed border-fg-subtle" style={{ bottom: `${(target / max) * 100}%` }}>
          <span className="absolute left-0 -top-4 px-1 text-[10px] leading-4 text-fg-subtle">target {target}</span>
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden>
          {series.map((k) => (
            <polyline
              key={k}
              points={days.map((d, i) => `${x(i)},${y(d[k])}`).join(" ")}
              fill="none"
              stroke={SERIES[k].stroke}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {hover != null && <div className="absolute top-0 bottom-0 w-px bg-line-strong" style={{ left: `${x(at)}%` }} />}
        {series.map((k) => (
          <div
            key={k}
            className={`absolute w-2 h-2 rounded-full ring-2 ring-canvas ${SERIES[k].bg} -translate-x-1/2 translate-y-1/2`}
            style={{ left: `${x(at)}%`, bottom: `${100 - y(days[at][k])}%` }}
          />
        ))}
      </div>
      <div className="relative h-4 mt-1 text-[10px] text-fg-subtle">
        {ticks.map((i, k) => (
          <span
            key={i}
            className={`absolute whitespace-nowrap ${k === 0 ? "" : i === n - 1 ? "-translate-x-full" : "-translate-x-1/2"}`}
            style={{ left: `${x(i)}%` }}
          >
            {fmtDay(days[i].key)}
          </span>
        ))}
      </div>
    </div>
  );
}

// "1172 applied · 39.1 a day · 9 days at 50+": the range's numbers in a line.
function Figures({ items }) {
  return (
    <p className="text-[11px] text-fg-subtle tabular-nums">
      {items.map(([v, label], i) => (
        <span key={label}>
          {i > 0 && " · "}
          <span className="font-semibold text-fg">{v}</span> {label}
        </span>
      ))}
    </p>
  );
}

export default function ActivityChart({ ledger }) {
  const [range, setRange] = useState(30);
  const [hoverA, setHoverA] = useState(null);
  const [hoverB, setHoverB] = useState(null);

  // Counts per day key.
  const byDay = useMemo(() => {
    const m = {};
    const bump = (ts, k) => {
      if (!ts) return;
      const key = dayKey(ts);
      m[key] = m[key] || { applied: 0, referral: 0, outreach: 0 };
      m[key][k] += 1;
    };
    Object.values(ledger || {}).forEach((t) => {
      bump(t.a, "applied");
      bump(t.r, "referral");
      bump(t.o, "outreach");
    });
    return m;
  }, [ledger]);

  const empty = { applied: 0, referral: 0, outreach: 0 };
  const tKey = todayKey();
  const today = byDay[tKey] || empty;
  const days = lastDays(range).map((d) => ({ ...d, ...(byDay[d.key] || empty) }));
  const sum = (k) => days.reduce((n, d) => n + d[k], 0);
  const at = (k) => days.filter((d) => d[k] >= TARGET[k]).length;
  const maxA = Math.max(TARGET.applied * 1.2, ...days.map((d) => d.applied));
  const maxB = Math.max(TARGET.referral * 1.3, ...days.map((d) => Math.max(d.referral, d.outreach)));

  const readout = (hover, render) => {
    const d = days[hover ?? days.length - 1];
    return (
      <span className="text-[11px] text-fg-muted tabular-nums">
        <span className="font-semibold text-fg">{hover == null ? "Today" : fmtDay(d.key)}</span> · {render(d)}
      </span>
    );
  };

  return (
    <section className="mt-8">
      {/* Today */}
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
        <h2 className="text-lg font-semibold text-fg">
          Today <span className="text-sm font-normal text-fg-subtle">{fmtDay(tKey)}</span>
        </h2>
        <p className="text-xs text-fg-subtle">
          Daily targets: {TARGET.applied} applications, {TARGET.referral} referral asks, {TARGET.outreach} recruiters messaged. Resets at 4am IST.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <TodayTile kind="applied" value={today.applied} />
        <TodayTile kind="referral" value={today.referral} />
        <TodayTile kind="outreach" value={today.outreach} />
      </div>

      {/* History */}
      <div className="mt-6 flex items-center justify-between flex-wrap gap-2 mb-2">
        <h3 className="text-sm font-semibold text-fg">Past days</h3>
        <div className={`${GLASS_TRACK} rounded-lg p-0.5 inline-flex gap-0.5`}>
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${range === r ? SEGMENT_ON : `text-fg-muted hover:bg-surface-hover ${SEGMENT_OFF}`}`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-canvas border border-line rounded-lg p-3">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-xs font-semibold text-fg">Applications per day</h4>
            {readout(hoverA, (d) => `${d.applied} applied`)}
          </div>
          <div className="mb-3">
            <Figures
              items={[
                [sum("applied"), "applied"],
                [(sum("applied") / range).toFixed(1), "a day"],
                [at("applied"), `days at ${TARGET.applied}+`],
              ]}
            />
          </div>
          <Lines
            days={days}
            series={["applied"]}
            max={maxA}
            target={TARGET.applied}
            hover={hoverA}
            setHover={setHoverA}
            label={`Applications per day, last ${range} days: ${sum("applied")} in all`}
          />
        </div>

        <div className="bg-canvas border border-line rounded-lg p-3">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-xs font-semibold text-fg">Referrals and outreach per day</h4>
            {readout(hoverB, (d) => `${d.referral} referral · ${d.outreach} outreach`)}
          </div>
          <div className="mb-3">
            <Figures
              items={[
                [sum("referral"), "referral asks"],
                [sum("outreach"), "messaged"],
                [at("referral"), `days at ${TARGET.referral}+ referrals`],
                [at("outreach"), `at ${TARGET.outreach}+ outreach`],
              ]}
            />
          </div>
          <Lines
            days={days}
            series={["referral", "outreach"]}
            max={maxB}
            target={TARGET.referral}
            hover={hoverB}
            setHover={setHoverB}
            label={`Referral asks and recruiter messages per day, last ${range} days: ${sum("referral")} and ${sum("outreach")}`}
          />
          <div className="mt-1 flex items-center gap-4 text-[11px] text-fg-muted">
            {["referral", "outreach"].map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span aria-hidden className={`inline-block w-3 h-0.5 rounded ${SERIES[k].bg}`} /> {SERIES[k].label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <details className="mt-2 text-xs text-fg-muted">
        <summary className="cursor-pointer text-[11px] font-semibold text-fg-subtle hover:text-fg">Show as table</summary>
        <table className="mt-2 w-full max-w-md tabular-nums">
          <thead>
            <tr className="text-left text-fg-subtle">
              <th className="py-1 font-semibold">Day</th>
              <th className="py-1 font-semibold text-right">Applied</th>
              <th className="py-1 font-semibold text-right">Referral</th>
              <th className="py-1 font-semibold text-right">Outreach</th>
            </tr>
          </thead>
          <tbody>
            {[...days].reverse().map((d) => (
              <tr key={d.key} className="border-t border-line">
                <td className="py-1">{fmtDay(d.key)}</td>
                <td className="py-1 text-right">{d.applied}</td>
                <td className="py-1 text-right">{d.referral}</td>
                <td className="py-1 text-right">{d.outreach}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
