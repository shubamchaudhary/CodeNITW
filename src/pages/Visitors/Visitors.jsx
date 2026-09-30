import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import PageShell from "../../components/PageShell";
import { GLASS } from "../../components/glass";
import { isDeviceExcluded } from "../../Data/visitTracker";

// The owner's view of who visits the site: headline numbers, visitors per
// day, where they went and came from, what they used, and who signed in.
// Data comes from /api/visitors (owner-checked there too); the same numbers
// are emailed every night by /api/visitor-report.

const RANGES = [
  { days: 1, label: "Today" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

const fmt = (v) => Number(v || 0).toLocaleString("en-IN");
const shortDate = (day) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(Date.parse(day));
const longDate = (day) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(Date.parse(day));
const clock = (ms) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(ms);

function ago(ms) {
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

async function fetchStats(days) {
  const user = getAuth().currentUser;
  const token = user && (await user.getIdToken());
  const res = await fetch(`/api/visitors?days=${days}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (res.status === 503) return { unavailable: true };
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function Visitors() {
  const [days, setDays] = useState(7);
  const [state, setState] = useState({ status: "loading", data: null });

  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, status: s.data ? "refreshing" : "loading" }));
    fetchStats(days)
      .then((d) => live && setState(d.unavailable ? { status: "unavailable", data: null } : { status: "ready", data: d }))
      .catch(() => live && setState((s) => ({ ...s, status: "error" })));
    return () => {
      live = false;
    };
  }, [days]);

  const data = state.data;
  const excluded = isDeviceExcluded();

  return (
    <PageShell>
      <div className="min-h-screen flex justify-center px-3">
        <div className="w-full sm:w-11/12 lg:w-5/6 xl:w-3/4 2xl:w-2/3 pt-6 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Visitors</h1>
              <p className="text-[13px] text-gray-500 dark:text-gray-400">
                Who's using InterviewPlanPrep · India time · your own visits aren't counted
                {excluded ? " (this device is excluded)" : ""}
              </p>
            </div>
            <div className={`rounded-xl ${GLASS} p-1 inline-flex gap-1`} role="group" aria-label="Date range">
              {RANGES.map((r) => (
                <button
                  key={r.days}
                  onClick={() => setDays(r.days)}
                  aria-pressed={days === r.days}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    days === r.days
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {state.status === "loading" && <Card className="py-16 text-center text-sm text-gray-400">Loading visits…</Card>}
          {state.status === "unavailable" && (
            <Card className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">Visit stats need the server's Firebase key, which isn't set here.</Card>
          )}
          {state.status === "error" && !data && (
            <Card className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">Couldn't load visits. Try again in a moment.</Card>
          )}

          {data && (
            <div className={`space-y-4 transition-opacity ${state.status === "refreshing" ? "opacity-60" : ""}`}>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Stat label="Visitors" value={fmt(data.totals.visitors)} />
                <Stat label="Page views" value={fmt(data.totals.views)} />
                <Stat label="Sessions" value={fmt(data.totals.sessions)} />
                <Stat label="New visitors" value={fmt(data.totals.newVisitors)} />
                <Stat
                  label="Signed in"
                  value={fmt(data.totals.signedInVisitors)}
                  sub={`${fmt(data.totals.signUps)} new account${data.totals.signUps === 1 ? "" : "s"} · ${fmt(data.totals.signIns)} sign-in${data.totals.signIns === 1 ? "" : "s"}`}
                />
              </div>

              <Card>
                <CardTitle title="Visitors per day" note={`${fmt(data.totals.views)} page views in all`} />
                <DailyColumns daily={data.daily} />
                <details className="mt-3 text-[12.5px]">
                  <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">Show as a table</summary>
                  <table className="mt-2 w-full tabular-nums">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400">
                        <th className="py-1 font-medium">Day</th>
                        <th className="py-1 font-medium text-right">Visitors</th>
                        <th className="py-1 font-medium text-right">Page views</th>
                        <th className="py-1 font-medium text-right">Signed in</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...data.daily].reverse().map((d) => (
                        <tr key={d.day} className="border-t border-gray-100 dark:border-white/[0.06] text-gray-700 dark:text-gray-300">
                          <td className="py-1">{longDate(d.day)}</td>
                          <td className="py-1 text-right">{fmt(d.visitors)}</td>
                          <td className="py-1 text-right">{fmt(d.views)}</td>
                          <td className="py-1 text-right">{fmt(d.signedIn)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardTitle title="Top pages" note="page views" />
                  <BarList rows={data.pages.map((r) => ({ key: r.path, label: r.path, value: r.views }))} empty="No page views yet." />
                </Card>
                <Card>
                  <CardTitle title="Where from" note="visitors" />
                  <BarList
                    rows={data.places.map((r) => ({ key: r.place, label: r.place, value: r.visitors }))}
                    empty="No locations yet."
                  />
                </Card>
                <Card>
                  <CardTitle title="Browsers and systems" note="visitors" />
                  <p className="mb-2 text-[12.5px] text-gray-500 dark:text-gray-400">
                    {fmt(data.devices.mobile)} on mobile · {fmt(data.devices.desktop)} on desktop
                  </p>
                  <BarList
                    rows={[
                      ...data.browsers.map((r) => ({ key: `b:${r.name}`, label: r.name, value: r.visitors })),
                      ...data.systems.map((r) => ({ key: `s:${r.name}`, label: r.name, value: r.visitors })),
                    ]}
                    empty="No devices yet."
                  />
                </Card>
                <Card>
                  <CardTitle title="Came from" note="visitors" />
                  <BarList rows={data.referrers.map((r) => ({ key: r.host, label: r.host, value: r.visitors }))} empty="Everyone came directly, or from a link that hides its source." />
                </Card>
              </div>

              <Card>
                <CardTitle title="Signed-in visitors" note={`${fmt(data.users.length)} account${data.users.length === 1 ? "" : "s"}`} />
                {data.users.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="text-left text-[12px] text-gray-500 dark:text-gray-400">
                          <th className="py-1.5 pr-3 font-medium">Name</th>
                          <th className="py-1.5 pr-3 font-medium">Email</th>
                          <th className="py-1.5 pr-3 font-medium">Where</th>
                          <th className="py-1.5 pr-3 font-medium text-right">Views</th>
                          <th className="py-1.5 font-medium text-right">Last seen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.users.map((u) => (
                          <tr key={u.uid} className="border-t border-gray-100 dark:border-white/[0.06] text-gray-700 dark:text-gray-300">
                            <td className="py-2 pr-3 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                              {u.name || "No name"}
                              {u.signedUp && (
                                <span className="ml-2 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/20">
                                  new account
                                </span>
                              )}
                            </td>
                            <td className="py-2 pr-3 break-all">{u.email || u.uid}</td>
                            <td className="py-2 pr-3 whitespace-nowrap">{u.place}</td>
                            <td className="py-2 pr-3 text-right tabular-nums">{fmt(u.views)}</td>
                            <td className="py-2 text-right whitespace-nowrap" title={clock(u.lastSeen)}>
                              {ago(u.lastSeen)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">Nobody signed in during this period.</p>
                )}
              </Card>

              <Card>
                <CardTitle title="Recent activity" note="newest first" />
                {data.recent.length ? (
                  <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {data.recent.map((e, i) => (
                      <li key={`${e.at}-${i}`} className="py-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[13px]">
                        <span className="w-[118px] shrink-0 tabular-nums text-gray-500 dark:text-gray-400">{clock(e.at)}</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {e.user || `Guest ${e.visitor}`}
                          {e.type !== "view" && (
                            <span className="ml-1.5 font-normal text-emerald-700 dark:text-emerald-300">{e.type === "signup" ? "created an account" : "signed in"}</span>
                          )}
                        </span>
                        {e.type === "view" && <span className="text-gray-700 dark:text-gray-300 break-all">{e.path}</span>}
                        <span className="ml-auto text-[12px] text-gray-500 dark:text-gray-400">
                          {e.place} · {e.device}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">No visits in this period yet.</p>
                )}
              </Card>

              {data.truncated && (
                <p className="px-1 text-[12px] text-gray-500 dark:text-gray-400">Showing the newest 20,000 visits in this range.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function Card({ children, className = "" }) {
  return <div className={`rounded-2xl ${GLASS} p-4 sm:p-5 ${className}`}>{children}</div>;
}

function CardTitle({ title, note }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {note && <span className="text-[12px] text-gray-500 dark:text-gray-400">{note}</span>}
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className={`rounded-2xl ${GLASS} px-4 py-3`}>
      <p className="text-[12px] text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-0.5 text-[24px] font-semibold text-gray-900 dark:text-gray-50">{value}</p>
      {sub && <p className="text-[11.5px] text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

// A ranked list: label, a thin bar scaled to the largest value, the value.
function BarList({ rows, empty }) {
  if (!rows.length) return <p className="text-[13px] text-gray-500 dark:text-gray-400">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate text-gray-700 dark:text-gray-300" title={r.label}>
              {r.label}
            </span>
            <span className="shrink-0 tabular-nums font-semibold text-gray-900 dark:text-gray-100">{fmt(r.value)}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-violet-600 dark:bg-violet-500" style={{ width: `${(100 * r.value) / max}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

// Clean axis ticks: 0 and up to 4 steps of 1, 2 or 5 × 10^k.
function ticksFor(max) {
  if (max <= 0) return [0, 1];
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw);
  const top = Math.ceil(max / step) * step;
  const out = [];
  for (let v = 0; v <= top + 1e-9; v += step) out.push(Math.round(v));
  return out;
}

// Visitors per day as columns: one series, so the title names it and there is
// no legend. Each day's column is its own hover/focus target (the whole slot,
// not just the painted bar) with a tooltip giving that day's numbers.
function DailyColumns({ daily }) {
  const boxRef = useRef(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState(null);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const update = () => setWidth(Math.max(260, Math.round(el.getBoundingClientRect().width)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = 200;
  const PAD = { top: 10, right: 4, bottom: 24, left: 36 };
  const plotW = width - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const ticks = useMemo(() => ticksFor(Math.max(...daily.map((d) => d.visitors), 0)), [daily]);
  const top = ticks[ticks.length - 1] || 1;
  const slot = plotW / Math.max(daily.length, 1);
  const barW = Math.max(2, Math.min(24, slot - 2, slot * 0.62));
  const y = (v) => PAD.top + plotH - (v / top) * plotH;
  const every = Math.max(1, Math.ceil(daily.length / Math.max(1, Math.floor(plotW / 58))));

  const bar = (x, v) => {
    const h = Math.max(0, (v / top) * plotH);
    if (h <= 0) return null;
    const r = Math.min(4, barW / 2, h);
    const yT = y(v);
    const base = PAD.top + plotH;
    return `M${x},${base} L${x},${yT + r} Q${x},${yT} ${x + r},${yT} L${x + barW - r},${yT} Q${x + barW},${yT} ${x + barW},${yT + r} L${x + barW},${base} Z`;
  };

  const tip = hover != null ? daily[hover] : null;
  const tipLeft = hover != null ? Math.min(Math.max(PAD.left + slot * hover + slot / 2, 80), width - 80) : 0;

  const onKey = useCallback(
    (e) => {
      if (e.key === "ArrowRight") setHover((h) => Math.min(daily.length - 1, (h ?? -1) + 1));
      if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? daily.length) - 1));
    },
    [daily.length]
  );

  return (
    <div ref={boxRef} className="relative" onPointerLeave={() => setHover(null)}>
      <svg width={width} height={H} role="img" aria-label="Visitors per day" tabIndex={0} onKeyDown={onKey} onBlur={() => setHover(null)} className="block focus:outline-none">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} strokeWidth="1" className="stroke-gray-200 dark:stroke-white/[0.08]" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-gray-500 dark:fill-gray-400 text-[11px] tabular-nums">
              {fmt(t)}
            </text>
          </g>
        ))}
        {daily.map((d, i) => {
          const x = PAD.left + slot * i + (slot - barW) / 2;
          const path = bar(x, d.visitors);
          return (
            <g key={d.day}>
              {path && (
                <path
                  d={path}
                  className={`transition-opacity ${hover != null && hover !== i ? "opacity-40" : ""} fill-violet-600 dark:fill-violet-500`}
                />
              )}
              {i % every === 0 && (
                <text x={PAD.left + slot * i + slot / 2} y={H - 6} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-[11px]">
                  {shortDate(d.day)}
                </text>
              )}
              <rect
                x={PAD.left + slot * i}
                y={PAD.top}
                width={slot}
                height={plotH}
                fill="transparent"
                onPointerEnter={() => setHover(i)}
                onPointerMove={() => setHover(i)}
              />
            </g>
          );
        })}
      </svg>
      {tip && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] shadow-sm dark:border-white/10 dark:bg-[#161b2e]"
          style={{ left: tipLeft }}
        >
          <p className="mb-1 font-medium text-gray-500 dark:text-gray-400">{longDate(tip.day)}</p>
          <p className="flex items-center gap-2">
            <span className="inline-block w-3 h-[2px] rounded bg-violet-600 dark:bg-violet-500" />
            <b className="tabular-nums text-gray-900 dark:text-gray-50">{fmt(tip.visitors)}</b>
            <span className="text-gray-500 dark:text-gray-400">visitors</span>
          </p>
          <p className="pl-5 text-gray-600 dark:text-gray-300">
            <b className="tabular-nums">{fmt(tip.views)}</b> page views · <b className="tabular-nums">{fmt(tip.signedIn)}</b> signed in
          </p>
        </div>
      )}
    </div>
  );
}
