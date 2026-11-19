import React, { useMemo, useState } from "react";
import { GLASS_TRACK, SEGMENT_ON, SEGMENT_OFF } from "../../components/glass";
import { dayKey, lastDays } from "./shared";

// Daily activity under the pipeline, as two small line charts: applications
// per day against a 50-a-day target, and referral asks + recruiter messages
// per day against a 5–10 band. Two charts, not one with two scales: the
// counts are an order apart. Days run 4am–4am IST (dayKey). The numbers come
// from the ledger (withLedger), so jobs erased or removed since still count.

const RANGES = [7, 30, 90];
const APPLY_TARGET = 50;
const REACH_BAND = [5, 10];

// One series per chart, so no legend: the title names it. Applications in the
// page's Applied green, referrals + outreach in the referral violet.
const STROKE = { applied: "var(--success)", reach: "var(--brand)" };
const DOT = { applied: "bg-success", reach: "bg-brand" };

// From the day key, so 1am IST still shows the day it belongs to.
const fmtDay = (key) => new Date(`${key}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

// A line over the days, a dashed target line (or a shaded band), a crosshair
// and dot on the hovered day, and sparse dates below. Hovering anywhere over
// the plot picks the nearest day.
function Line({ days, value, max, target, band, series, hover, setHover, label }) {
  const n = days.length;
  const x = (i) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v) => 100 - (Math.min(v, max) / max) * 100;
  const points = days.map((d, i) => `${x(i)},${y(value(d))}`).join(" ");
  const pick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };
  const at = hover ?? n - 1; // no hover: today
  const pct = (v) => `${(v / max) * 100}%`;
  const ticks = [0, Math.floor((n - 1) / 2), n - 1];
  return (
    <div>
      <div className="relative h-24 cursor-crosshair" role="img" aria-label={label} onMouseMove={pick} onMouseLeave={() => setHover(null)}>
        <div className="absolute inset-x-0 bottom-0 border-t border-line" />
        {band && (
          <div className="absolute inset-x-0 bg-accent-subtle" style={{ bottom: pct(band[0]), height: pct(band[1] - band[0]) }}>
            <span className="absolute left-0 top-0 px-1 text-[10px] leading-4 text-fg-subtle">
              {band[0]}–{band[1]}
            </span>
          </div>
        )}
        {target && (
          <div className="absolute inset-x-0 border-t border-dashed border-fg-subtle" style={{ bottom: pct(target) }}>
            <span className="absolute left-0 -top-4 px-1 text-[10px] leading-4 text-fg-subtle">{target}</span>
          </div>
        )}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden>
          <polyline
            points={points}
            fill="none"
            stroke={STROKE[series]}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {hover != null && <div className="absolute top-0 bottom-0 w-px bg-line-strong" style={{ left: `${x(at)}%` }} />}
        <div
          className={`absolute w-2 h-2 rounded-full ring-2 ring-canvas ${DOT[series]} -translate-x-1/2 translate-y-1/2`}
          style={{ left: `${x(at)}%`, bottom: `${100 - y(value(days[at]))}%` }}
        />
      </div>
      <div className="relative h-4 mt-1 text-[10px] text-fg-subtle">
        {[...new Set(ticks)].map((i, k) => (
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

  const days = lastDays(range).map((d) => ({ ...d, ...(byDay[d.key] || { applied: 0, referral: 0, outreach: 0 }) }));
  const sum = (k) => days.reduce((n, d) => n + d[k], 0);
  const applied = sum("applied");
  const referral = sum("referral");
  const outreach = sum("outreach");
  const reach = (d) => d.referral + d.outreach;
  const hitDays = days.filter((d) => d.applied >= APPLY_TARGET).length;
  const reachDays = days.filter((d) => reach(d) >= REACH_BAND[0]).length;
  const maxA = Math.max(APPLY_TARGET * 1.2, ...days.map((d) => d.applied));
  const maxB = Math.max(REACH_BAND[1] * 1.3, ...days.map(reach));

  const readout = (hover, render) => {
    const d = days[hover ?? days.length - 1];
    return (
      <span className="text-[11px] text-fg-muted tabular-nums">
        <span className="font-semibold text-fg">{hover == null ? "Today" : fmtDay(d.key)}</span> · {render(d)}
      </span>
    );
  };

  return (
    <section className="mt-8 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div>
          <h2 className="text-sm font-semibold text-fg">Daily activity</h2>
          <p className="text-[11px] text-fg-subtle">Days run 4am to 4am IST.</p>
        </div>
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="bg-canvas border border-line rounded-lg p-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-xs font-semibold text-fg">Applications per day</h3>
            {readout(hoverA, (d) => `${d.applied} applied`)}
          </div>
          <div className="mb-3">
            <Figures items={[[applied, "applied"], [(applied / range).toFixed(1), `a day (target ${APPLY_TARGET})`], [hitDays, `days at ${APPLY_TARGET}+`]]} />
          </div>
          <Line
            days={days}
            value={(d) => d.applied}
            max={maxA}
            target={APPLY_TARGET}
            series="applied"
            hover={hoverA}
            setHover={setHoverA}
            label={`Applications per day, last ${range} days: ${applied} in all`}
          />
        </div>

        <div className="bg-canvas border border-line rounded-lg p-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-xs font-semibold text-fg">Referrals + outreach per day</h3>
            {readout(hoverB, (d) => `${d.referral} referral · ${d.outreach} outreach`)}
          </div>
          <div className="mb-3">
            <Figures items={[[referral, "referral asks"], [outreach, "messaged"], [reachDays, `days at ${REACH_BAND[0]}+`]]} />
          </div>
          <Line
            days={days}
            value={reach}
            max={maxB}
            band={REACH_BAND}
            series="reach"
            hover={hoverB}
            setHover={setHoverB}
            label={`Referral asks plus recruiter messages per day, last ${range} days: ${referral} and ${outreach}`}
          />
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
