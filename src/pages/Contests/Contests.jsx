import React, { useCallback, useEffect, useMemo, useState } from "react";
import { fetchContests, peekContests } from "../../Data/contestsFeed";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { SiCodechef, SiCodeforces, SiLeetcode } from "react-icons/si";
import PageShell from "../../components/PageShell";
import { GLASS } from "../../components/glass";
import { requireAuth } from "../../Data/authGate";

// Upcoming LeetCode, Codeforces and CodeChef contests, from /api/contests,
// grouped by day in the visitor's own time zone — plus the one button that
// turns reminder emails on (a day before and an hour before each contest).

// The site's glass card without its backdrop blur: some GPUs make Chrome draw a
// shifted strip of the page's background lights inside blurred cards (a band
// across the top of the "Next up" card), and over this dark backdrop the blur
// isn't visible anyway.
const CARD = GLASS.replace(/backdrop-blur-\S+\s*/, "");

const PLATFORMS = {
  leetcode: {
    label: "LeetCode",
    Icon: SiLeetcode,
    tile: "bg-[#FFA116]/[0.12] ring-[#FFA116]/30",
    color: "text-[#FFA116]",
  },
  codeforces: {
    label: "Codeforces",
    Icon: SiCodeforces,
    tile: "bg-[#1F8ACB]/[0.12] ring-[#1F8ACB]/30",
    color: "text-[#1F8ACB] dark:text-[#4aa8e0]",
  },
  codechef: {
    label: "CodeChef",
    Icon: SiCodechef,
    tile: "bg-[#8B5E3C]/[0.12] ring-[#8B5E3C]/30",
    color: "text-[#5B4638] dark:text-[#c89b72]",
  },
};

// A platform's logo on a tinted tile, in the platform's own colour.
function PlatformTile({ platform, size = "md" }) {
  const p = PLATFORMS[platform];
  const box = size === "lg" ? "w-14 h-14 rounded-2xl text-[26px]" : "w-10 h-10 rounded-xl text-[18px]";
  return (
    <span className={`${box} shrink-0 ring-1 flex items-center justify-center ${p.tile} ${p.color}`} title={p.label}>
      <p.Icon aria-hidden="true" />
    </span>
  );
}

// ── Formatting ──────────────────────────────────────────────────────────────
const dayKey = (t) => new Date(t).toLocaleDateString("en-CA");
function dayLabel(t, now) {
  if (dayKey(t) === dayKey(now)) return "Today";
  if (dayKey(t) === dayKey(now + 864e5)) return "Tomorrow";
  return new Date(t).toLocaleDateString(undefined, { weekday: "long" });
}
const dateLabel = (t) => new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short" });
const timeLabel = (t) => new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const weekdayShort = (t) => new Date(t).toLocaleDateString(undefined, { weekday: "short" });
const dayNumber = (t) => new Date(t).toLocaleDateString(undefined, { day: "numeric" });
const monthShort = (t) => new Date(t).toLocaleDateString(undefined, { month: "short" });
function durationLabel(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
}
function countdown(ms) {
  const min = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  if (d) return `in ${d}d ${h}h`;
  if (h) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}

// ── Reminder subscription ───────────────────────────────────────────────────
// status: "loading" | "off" | "pending" (waiting on the confirmation email)
//         | "on" | "unavailable" (the server side isn't set up)
async function callAlerts(method, body) {
  const user = getAuth().currentUser;
  const token = user && (await user.getIdToken());
  const res = await fetch("/api/contest-alerts", {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 503 || data.error === "not-configured") return { unavailable: true };
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
const statusOf = (d) => (d.unavailable ? "unavailable" : !d.subscribed ? "off" : d.confirmed ? "on" : "pending");

function useAlerts(user) {
  const [status, setStatus] = useState("loading");
  const [email, setEmail] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    if (!user) {
      setStatus("off");
      return undefined;
    }
    setStatus("loading");
    callAlerts("GET")
      .then((d) => live && (setStatus(statusOf(d)), setEmail(d.email || user.email)))
      .catch(() => live && setStatus("off"));
    return () => {
      live = false;
    };
  }, [user]);

  const toggle = useCallback(async () => {
    if (!requireAuth("Sign in to get contest reminders — they're emailed to your account's address.")) return;
    if (status === "unavailable") {
      toast.info("Email reminders aren't switched on for this site yet.");
      return;
    }
    setBusy(true);
    try {
      if (status === "on") {
        const d = await callAlerts("DELETE");
        setStatus(statusOf(d));
        toast.info("Contest reminders turned off");
      } else {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const d = await callAlerts("POST", { timeZone });
        setStatus(statusOf(d));
        setEmail(d.email);
        if (d.unavailable) toast.info("Email reminders aren't switched on for this site yet.");
        else if (d.confirmed) toast.success(`Reminders on — a day and an hour before each contest, to ${d.email}`);
        else if (d.confirmationSent) toast.info(`Check ${d.email} and confirm to start getting reminders`);
        else toast.info(`A confirmation email is already on its way to ${d.email}`);
      }
    } catch (_) {
      toast.error("Couldn't update your reminders. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }, [status]);

  return { status, email, busy, toggle };
}

function AlertsButton({ alerts, signedIn }) {
  const { status, email, busy, toggle } = alerts;
  const base =
    "inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-bold transition-all disabled:opacity-60 whitespace-nowrap";
  let look;
  let label;
  let title;
  if (signedIn && status === "on") {
    look = "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20";
    label = "✓ Reminders on";
    title = `Emails go to ${email}. Click to turn them off.`;
  } else if (signedIn && status === "pending") {
    look = "text-amber-700 dark:text-amber-300 bg-amber-500/10 ring-1 ring-amber-500/30 hover:bg-amber-500/20";
    label = "Confirm in your inbox";
    title = `We sent a confirmation link to ${email}. Click to send it again.`;
  } else {
    look = "text-white bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/25 hover:from-violet-500 hover:to-indigo-500";
    label = "Get email reminders";
    title = "An email a day before and an hour before each contest";
  }
  return (
    <div className="flex flex-col items-start sm:items-end gap-1">
      <button onClick={toggle} disabled={busy || (signedIn && status === "loading")} title={title} className={`${base} ${look}`}>
        {status !== "on" && status !== "pending" && (
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 3a4.5 4.5 0 0 0-4.5 4.5v2.7L4 13h12l-1.5-2.8V7.5A4.5 4.5 0 0 0 10 3Zm-1.7 12a1.8 1.8 0 0 0 3.4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {label}
      </button>
      <p className="text-[11.5px] text-gray-500 dark:text-gray-400">
        {signedIn && status === "on"
          ? `A day and an hour before each contest · ${email}`
          : signedIn && status === "pending"
          ? `Confirmation sent to ${email}`
          : "A day before and an hour before each contest"}
      </p>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function Contests() {
  const [user, setUser] = useState(() => getAuth().currentUser);
  useEffect(() => onAuthStateChanged(getAuth(), (u) => setUser(u || null)), []);
  const alerts = useAlerts(user);

  const [data, setData] = useState(() => {
    const d = peekContests();
    return d ? { status: "ready", ...d } : { status: "loading", contests: [], failed: [] };
  });
  const load = useCallback((fresh) => {
    const d = peekContests();
    if (!fresh && d) return setData({ status: "ready", ...d });
    setData((prev) => ({ ...prev, status: "loading" }));
    fetchContests({ fresh })
      .then((res) => setData({ status: "ready", ...res }))
      .catch(() => setData({ status: "error", contests: [], failed: [] }));
  }, []);
  useEffect(() => load(false), [load]);

  // Countdowns tick; contests that have started drop off the list.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const upcoming = useMemo(() => data.contests.filter((c) => c.start > now), [data.contests, now]);
  const next = upcoming[0];
  const days = useMemo(() => {
    const groups = [];
    for (const c of upcoming.slice(1)) {
      const key = dayKey(c.start);
      if (groups.at(-1)?.key !== key) groups.push({ key, start: c.start, contests: [] });
      groups.at(-1).contests.push(c);
    }
    return groups;
  }, [upcoming]);

  return (
    <PageShell>
      <div className="min-h-screen flex justify-center px-3">
        <div className="w-full sm:w-11/12 lg:w-5/6 xl:w-3/4 2xl:w-2/3">
          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`mt-6 mb-5 rounded-3xl ${CARD} px-5 sm:px-7 py-5`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-[26px] leading-none font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-800 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400">
                    Contests
                  </h1>
                  {data.status === "ready" && (
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-violet-500/10 dark:bg-violet-400/10 text-violet-600 dark:text-violet-300 border border-violet-500/25 dark:border-violet-400/25">
                      {upcoming.length} upcoming
                    </span>
                  )}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] text-gray-500 dark:text-gray-400">
                  {Object.entries(PLATFORMS).map(([key, p]) => (
                    <span key={key} className="inline-flex items-center gap-1.5">
                      <p.Icon className={`text-[14px] ${p.color}`} aria-hidden="true" />
                      {p.label}
                    </span>
                  ))}
                  <span className="text-gray-400 dark:text-gray-500">· times in your time zone</span>
                </div>
              </div>
              <AlertsButton alerts={alerts} signedIn={!!user} />
            </div>
          </motion.div>

          {data.status === "ready" && data.failed.length > 0 && (
            <p className="mb-4 text-[12.5px] text-amber-700 dark:text-amber-300">
              Couldn't reach {data.failed.map((p) => PLATFORMS[p]?.label || p).join(" and ")} just now, so some contests may be missing.
            </p>
          )}

          {/* ── List ── */}
          {data.status === "loading" && <Skeleton />}

          {data.status === "error" && (
            <div className={`rounded-2xl ${CARD} px-5 py-10 text-center`}>
              <p className="text-[14px] text-gray-600 dark:text-gray-300">Couldn't load contests right now.</p>
              <button onClick={() => load(true)} className="mt-3 text-[13px] font-bold text-violet-600 dark:text-violet-300 hover:underline">
                Try again
              </button>
            </div>
          )}

          {data.status === "ready" && !next && (
            <div className={`rounded-3xl ${CARD} px-5 py-10 text-center text-[14px] text-gray-600 dark:text-gray-300`}>
              No upcoming contests announced yet.
            </div>
          )}

          {data.status === "ready" && next && <NextUp contest={next} now={now} />}

          {data.status === "ready" && days.length > 0 && (
            <section className={`mb-8 rounded-3xl ${CARD} overflow-hidden`}>
              <h2 className="px-5 sm:px-6 pt-4 pb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Coming up
              </h2>
              {days.map((day) => {
                const word = dayLabel(day.start, now);
                return (
                  <div
                    key={day.key}
                    className="border-t border-gray-200/70 dark:border-white/[0.06] px-3 sm:px-4 py-1.5 sm:grid sm:grid-cols-[5.5rem_1fr] sm:gap-2"
                  >
                    <div className="px-2 pt-3 pb-0.5 sm:pb-3 flex sm:block items-baseline gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                        {word === "Today" || word === "Tomorrow" ? word : weekdayShort(day.start)}
                      </p>
                      <p className="text-[13px] sm:text-[22px] sm:leading-tight font-extrabold text-gray-800 dark:text-gray-100">
                        {dayNumber(day.start)}{" "}
                        <span className="text-[13px] font-semibold text-gray-400 dark:text-gray-500">{monthShort(day.start)}</span>
                      </p>
                    </div>
                    <div className="divide-y divide-gray-200/60 dark:divide-white/[0.05]">
                      {day.contests.map((c) => (
                        <ContestRow key={c.id} contest={c} now={now} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </div>
      </div>
    </PageShell>
  );
}

const OpenIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M4 2.5h5.5V8M9.5 2.5 2.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// The soonest contest, big: the one you'd act on first.
function NextUp({ contest: c, now }) {
  const p = PLATFORMS[c.platform];
  return (
    <section className={`mb-5 rounded-3xl ${CARD} px-5 sm:px-6 py-5`}>
      <div className="flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <PlatformTile platform={c.platform} size="lg" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">Next up · {p.label}</p>
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 block text-[19px] sm:text-[21px] leading-snug font-extrabold tracking-tight text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-300"
            >
              {c.name}
            </a>
            <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
              {dayLabel(c.start, now)}, {dateLabel(c.start)} · {timeLabel(c.start)} · {durationLabel(c.durationMin)}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-4 md:gap-5 shrink-0">
          <div className="md:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Starts in</p>
            <p className="text-[22px] leading-tight font-extrabold tabular-nums text-gray-900 dark:text-white">
              {countdown(c.start - now).replace(/^in /, "")}
            </p>
          </div>
          <a
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-bold text-white bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/25 hover:from-violet-500 hover:to-indigo-500 whitespace-nowrap"
          >
            Open contest <OpenIcon />
          </a>
        </div>
      </div>
    </section>
  );
}

function ContestRow({ contest: c, now }) {
  const p = PLATFORMS[c.platform];
  const left = c.start - now;
  const soon = left < 24 * 3600 * 1000;
  return (
    <div className="flex items-center gap-3 sm:gap-4 px-2 py-3">
      <PlatformTile platform={c.platform} />
      <div className="flex-1 min-w-0">
        <a
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[14px] font-bold text-gray-800 dark:text-gray-100 hover:text-violet-600 dark:hover:text-violet-300 truncate"
        >
          {c.name}
        </a>
        <p className="mt-0.5 text-[12.5px] text-gray-500 dark:text-gray-400">
          {p.label} · {timeLabel(c.start)} · {durationLabel(c.durationMin)}
        </p>
      </div>
      <span
        className={`hidden sm:inline-block shrink-0 px-2.5 py-1 rounded-full text-[11.5px] font-bold tabular-nums ${
          soon ? "bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500/25" : "text-gray-500 dark:text-gray-400"
        }`}
      >
        {countdown(left)}
      </span>
      <a
        href={c.url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 inline-flex items-center gap-1 h-8 px-3 rounded-lg text-[12.5px] font-bold text-gray-600 dark:text-gray-300 bg-white/60 dark:bg-white/[0.05] ring-1 ring-gray-200/90 dark:ring-white/[0.08] hover:text-violet-600 dark:hover:text-violet-300"
      >
        Open <OpenIcon />
      </a>
    </div>
  );
}

function Skeleton() {
  const bar = "bg-gray-200/70 dark:bg-white/[0.06] animate-pulse";
  return (
    <div aria-hidden="true">
      <div className={`mb-5 rounded-3xl ${CARD} px-6 py-5 flex items-center gap-4`}>
        <span className={`w-14 h-14 rounded-2xl ${bar}`} />
        <div className="flex-1 space-y-2.5">
          <div className={`h-3 w-24 rounded ${bar}`} />
          <div className={`h-5 w-1/2 rounded ${bar}`} />
          <div className={`h-3 w-1/3 rounded ${bar}`} />
        </div>
      </div>
      <div className={`rounded-3xl ${CARD} px-6 py-4 space-y-5`}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <span className={`w-10 h-10 rounded-xl ${bar}`} />
            <div className="flex-1 space-y-2">
              <div className={`h-3.5 w-2/5 rounded ${bar}`} />
              <div className={`h-3 w-1/4 rounded ${bar}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
