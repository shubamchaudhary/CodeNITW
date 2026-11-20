import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";
import { HiOutlineExternalLink, HiCheck, HiX, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { GLASS, GLASS_TRACK, SEGMENT_ON, SEGMENT_OFF } from "../../components/glass";
import { normalizeUrl, todayKey } from "./shared";

// Owner-only feed from the job radar (scripts/radar/run.mjs). The radar runs on
// the owner's PC five times a day and POSTs to /api/radar, which keeps the openings
// of the last 15 days in Firestore; this tab reads them back, page by page.
// Each opening has already passed the radar's checks: backend title in India,
// a years range that includes 2, a skills match above 0, and no posted salary
// topping out under 22 LPA. The pay label says how likely it is to reach the
// 25 LPA minimum.
//
// The last load is kept on this device for CACHE_TTL (30 min), so the tab
// opens instantly; past that it's still shown while a fresh copy loads.
//
// It's a triage board: BATCH cards at a time, newest first, each with its
// title, pay, years and skills right above its three buttons (skip, open,
// To Apply), so deciding takes no travel across the screen. A decided card
// leaves and the next one fills its place; "Next 20" moves past a batch
// without deciding it. Every decision can be undone from its toast.

const BATCH = 20;
const NEW_HOURS = 30; // "new" = first stored by a run in roughly the last day
const API_PAGE = 200; // openings per /api/radar request
const MAX_API_PAGES = 10;

// The radar keeps only openings whose asked range includes 2 years ("fits") or
// that don't say ("unknown"). Anything else still stored from older rules, and
// any 0 skills match, is hidden here until the next run deletes it.
const EXP_LABEL = { fits: "2 yrs in range", unknown: "yrs ?" };
const EXP_CLS = {
  fits: "bg-success-subtle text-success-fg  ",
  unknown: "bg-surface-hover text-fg-subtle  ",
};
const relevant = (o) => (o.exp === "fits" || o.exp === "unknown" || !o.exp) && o.matchScore > 0;

// "1–3 yrs", "2+ yrs", or null when the posting doesn't say.
function yearsText(o) {
  if (o.minYoe == null) return null;
  return o.maxYoe != null ? `${o.minYoe}–${o.maxYoe} yrs` : `${o.minYoe}+ yrs`;
}
// Pay against the 25 LPA minimum (scripts/radar/pay.mjs). Nothing that could
// reach it is dropped by the radar, so every label is shown by default.
const PAY_LABEL = {
  meets: "25L+ posted",
  close: "pay close",
  fifteen: "15L+ posted",
  hidden: "pay hidden",
  likely: "25L+ likely",
  maybe: "pay maybe",
  low: "pay low",
  unlikely: "pay unlikely",
  unknown: "pay ?",
};
const PAY_HINT = {
  meets: "The posted salary reaches 25L",
  close: "Posted salary tops out at 22–25L, or a figure from the description text",
  fifteen: "The posted salary reaches 15L but not 22L (Naukri job finder)",
  hidden: "The employer hid the salary on the listing; Naukri's own data has this range (Naukri job finder)",
  likely: "levels.fyi: a quarter of this company's India engineers earn 25L+ even at its 25th percentile",
  maybe: "levels.fyi: this company's India median is 25L+",
  low: "levels.fyi: median under 25L, but its top 10% earn 25L+",
  unlikely: "levels.fyi: even this company's top 10% in India earn under 25L",
  unknown: "No pay data",
};
const PAY_CLS = {
  meets: "bg-success-subtle text-success-fg  ",
  close: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
  fifteen: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
  hidden: "bg-surface-hover text-fg  ",
  likely: "bg-success-subtle text-success-fg  ",
  maybe: "bg-warning-subtle text-warning-fg  ",
  low: "bg-surface-hover text-fg  ",
  unlikely: "bg-danger-subtle text-danger-fg  ",
  unknown: "bg-surface-hover text-fg-subtle  ",
};

// The Naukri job finder (extensions/naukri-refresher) uploads today's Naukri jobs with a rank
// and the list they're on, one list per Naukri account; Naukri allows 50 applies a day each.
const DAILY_TOP = 50;
const PROFILES = [
  { id: "backend", label: "Backend", hint: "Backend-first roles, checked against your SDE resume: apply from your Backend Naukri account" },
  { id: "ai", label: "AI", hint: "AI-first roles, checked against your GenAI resume: apply from your AI Naukri account" },
];
const profileLabel = (id) => (PROFILES.find((p) => p.id === id) || PROFILES[0]).label;
const SCOPE_TEXT = { both: "both lists", backend: "the Backend list", ai: "the AI list" };
// The list last picked on this device (each browser is usually one Naukri account).
const PROFILE_KEY = "openingsProfile.v1";
function readProfile() {
  try {
    const p = localStorage.getItem(PROFILE_KEY);
    return p === "backend" || p === "ai" ? p : null;
  } catch (_) {
    return null;
  }
}
function writeProfile(p) {
  try {
    localStorage.setItem(PROFILE_KEY, p);
  } catch (_) {
    // not saved: the tab just opens on the default next time
  }
}
// "14:05", or "20 Nov, 14:05" when it wasn't today.
function sentAt(t) {
  const d = new Date(t);
  return Date.now() - t < 20 * 3600000
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
const MODE_KEY = "openingsMode.v1";
function readMode() {
  try {
    const m = localStorage.getItem(MODE_KEY);
    return m === "naukri" || m === "all" ? m : null;
  } catch (_) {
    return null;
  }
}
function writeMode(m) {
  try {
    localStorage.setItem(MODE_KEY, m);
  } catch (_) {
    // not saved: the tab just opens on the default next time
  }
}

// "just now" / "3 h ago" from epoch ms.
function hoursAgo(t) {
  if (!t) return "";
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 60) return m < 2 ? "just now" : `${m} min ago`;
  return `${Math.floor(m / 60)} h ago`;
}
const SOURCE_LABEL = {
  board: "Company board",
  riley: "ATS dataset",
  careerops: "career-ops",
  naukri: "Naukri",
  indeed: "Indeed",
  glassdoor: "Glassdoor",
  linkedin: "LinkedIn",
};

// Same opaque card as the Pipeline tab's.
const CARD =
  "bg-canvas border border-line     ";
const ACTION = "inline-flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-lg transition-colors";

function scoreCls(s) {
  if (s >= 70) return "bg-success-subtle text-success-fg  ";
  if (s >= 45) return "bg-surface-hover text-fg  ";
  if (s >= 25) return "bg-warning-subtle text-warning-fg  ";
  return "bg-surface-hover text-fg-subtle  ";
}

// Snippets stored before the radar cleaned escaped HTML can still hold "<p>"
// or "&#43;"; show them as text.
function plainText(s) {
  return String(s)
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// "today" / "3d ago" from epoch ms or a date string.
function ago(t) {
  const ms = typeof t === "number" ? t : Date.parse(t || "");
  if (!ms) return "";
  const h = Math.floor((Date.now() - ms) / 3600000);
  return h < 24 ? "today" : `${Math.floor(h / 24)}d ago`;
}

// Every stored opening (newest first): one request for the API's snapshot,
// following its page cursor only if there's no snapshot yet.
async function loadRadar() {
  const user = getAuth().currentUser;
  const token = user && (await user.getIdToken());
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const openings = [];
  let summary = null;
  let finderSummary = null;
  let finderRuns = null;
  let cursor = null;
  for (let page = 0; page < MAX_API_PAGES; page++) {
    const q = cursor ? `?limit=${API_PAGE}&cursor=${encodeURIComponent(cursor)}` : `?all=1&limit=${API_PAGE}`;
    const res = await fetch(`/api/radar${q}`, { headers });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) throw new Error(data?.error || `HTTP ${res.status}`);
    if (page === 0) {
      summary = data.summary;
      finderSummary = data.finderSummary || null;
      finderRuns = data.finderRuns || null;
    }
    openings.push(...data.openings);
    cursor = data.nextCursor;
    if (!cursor) break;
  }
  return { summary, finderSummary, finderRuns, openings };
}

// The last load, kept on this device so the tab opens instantly. Older than
// CACHE_TTL it's still shown at once, and refreshed in the background (the
// radar only uploads five times a day, so it's rarely far behind).
const CACHE_KEY = "radarOpeningsCache.v1";
const CACHE_TTL = 30 * 60 * 1000;

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY));
    return c?.data?.openings ? c : null;
  } catch (_) {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch (_) {
    // full or unavailable: the tab just loads from the API next time
  }
}

function minutesAgo(t) {
  const m = Math.floor((Date.now() - t) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ago`;
}

function Chip({ on, onClick, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
        on ? SEGMENT_ON : `text-fg-muted  hover:bg-surface-hover  ${SEGMENT_OFF}`
      }`}
    >
      {children}
    </button>
  );
}

const Tag = ({ cls, title, children }) => (
  <span title={title} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cls}`}>
    {children}
  </span>
);

// One opening. Everything needed to decide sits above its three buttons.
function OpeningCard({ o, isNew, onSkip, onApply }) {
  const years = yearsText(o);
  return (
    <div className={`${CARD} rounded-lg p-3.5 h-full flex flex-col gap-2`}>
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${scoreCls(o.matchScore)}`}
          title="How much of the tech this job asks for is on your resume"
        >
          {o.matchScore}% match
        </span>
        {isNew && <Tag cls="bg-success-subtle text-success-fg ">NEW</Tag>}
        <span className="text-xs font-semibold text-fg-muted truncate">{o.company}</span>
        <span className="ml-auto shrink-0 text-[10px] text-fg-subtle">{ago(o.openedAt)}</span>
      </div>

      <a
        href={o.url}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-semibold leading-snug text-accent-fg hover:underline line-clamp-2"
        title={o.title}
      >
        {o.title}
      </a>
      <div className="text-[11px] text-fg-subtle truncate" title={o.location}>
        {o.location || "India"} · {(o.sources || [o.source]).map((k) => SOURCE_LABEL[k] || k).join(" + ")}
      </div>

      <div className="flex flex-wrap gap-1">
        <Tag cls={EXP_CLS[o.exp] || EXP_CLS.unknown} title={years ? `Asks for ${years}` : "The posting doesn't say how many years"}>
          {years || EXP_LABEL.unknown}
        </Tag>
        <Tag
          cls={PAY_CLS[o.pay?.verdict] || PAY_CLS.unknown}
          title={[PAY_HINT[o.pay?.verdict], o.pay?.text].filter(Boolean).join("\n") || PAY_HINT.unknown}
        >
          {PAY_LABEL[o.pay?.verdict] || PAY_LABEL.unknown}
        </Tag>
      </div>

      {(o.matched?.length > 0 || o.missing?.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {(o.matched || []).slice(0, 6).map((m) => (
            <Tag
              key={m.skill}
              cls={
                m.type === "want"
                  ? "bg-surface-hover text-fg  "
                  : "bg-success-subtle text-success-fg  "
              }
              title={m.type === "want" ? "A skill you want to grow into" : "On your resume"}
            >
              {m.type === "want" ? "↗" : "✓"} {m.skill}
            </Tag>
          ))}
          {(o.missing || []).slice(0, 3).map((s) => (
            <Tag key={s} cls="bg-danger-subtle text-danger-fg  " title="Asked for, not on your resume">
              ✗ {s}
            </Tag>
          ))}
        </div>
      )}

      {o.snippet && <p className="text-[11px] leading-relaxed text-fg-subtle line-clamp-2">{plainText(o.snippet)}</p>}

      <div className="mt-auto pt-1 grid grid-cols-3 gap-1.5">
        <button
          onClick={onSkip}
          title="Not for me"
          className={`${ACTION} border border-line text-danger-fg hover:bg-surface-hover `}
        >
          <HiX className="w-3.5 h-3.5" /> Skip
        </button>
        <a
          href={o.url}
          target="_blank"
          rel="noreferrer"
          title="Open the posting in a new tab"
          className={`${ACTION} border border-line-strong text-fg-muted hover:bg-surface-hover `}
        >
          <HiOutlineExternalLink className="w-3.5 h-3.5" /> Open
        </a>
        <button onClick={onApply} title="Save in To Apply" className={`${ACTION} bg-success hover:opacity-90 text-white`}>
          <HiCheck className="w-3.5 h-3.5" /> To Apply
        </button>
      </div>
    </div>
  );
}

// One of today's Naukri jobs, numbered by rank. Open it, apply on Naukri with the profile it
// names, then press Applied (it goes into the pipeline as applied today).
function FinderCard({ o, n, onSkip, onApplied }) {
  const years = yearsText(o);
  const profile = PROFILES.find((p) => p.id === o.profile) || PROFILES[0];
  const skills =
    o.coverage != null ? `${o.skillsHave}/${o.skillsTotal} skills · ${o.coverage}%` : "skills ?";
  return (
    <div className={`${CARD} rounded-lg p-3.5 h-full flex flex-col gap-2`}>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="shrink-0 text-[11px] font-bold text-fg-muted tabular-nums">#{n}</span>
        <span
          className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${scoreCls(o.rank)}`}
          title="Rank 0–100: skills match, title, experience, pay, company rating, how fresh"
        >
          {o.rank}
        </span>
        <span className="text-xs font-semibold text-fg-muted truncate">{o.company}</span>
        {o.rating != null && (
          <span className="shrink-0 text-[10px] text-fg-subtle" title={`AmbitionBox rating${o.reviews ? `, ${o.reviews} reviews` : ""}`}>
            ★ {o.rating}
          </span>
        )}
        <span className="ml-auto shrink-0 text-[10px] text-fg-subtle">{hoursAgo(o.postedTime) || "today"}</span>
      </div>

      <a
        href={o.url}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-semibold leading-snug text-accent-fg hover:underline line-clamp-2"
        title={o.title}
      >
        {o.title}
      </a>
      <div className="text-[11px] text-fg-subtle truncate" title={o.location}>
        {o.location || "India"} · <span title={profile.hint}>apply from your {profile.label} account</span>
      </div>

      <div className="flex flex-wrap gap-1">
        <Tag cls={EXP_CLS[o.exp] || EXP_CLS.unknown} title={years ? `Asks for ${years}` : "The listing doesn't say how many years"}>
          {years || EXP_LABEL.unknown}
        </Tag>
        <Tag cls={PAY_CLS[o.pay?.verdict] || PAY_CLS.unknown} title={[PAY_HINT[o.pay?.verdict], o.pay?.text].filter(Boolean).join("\n")}>
          {o.pay?.verdict === "unknown" ? "pay not shown" : o.pay?.text || PAY_LABEL.unknown}
        </Tag>
        <Tag
          cls={o.coverage >= 95 ? "bg-success-subtle text-success-fg  " : "bg-surface-hover text-fg  "}
          title={`How much of the tech this job's Naukri tags ask for is on your ${profile.id === "ai" ? "GenAI" : "SDE"} resume`}
        >
          {skills}
        </Tag>
      </div>

      {(o.matched?.length > 0 || o.missing?.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {(o.matched || []).slice(0, 6).map((m) => (
            <Tag
              key={m.skill}
              cls={m.type === "want" ? "bg-surface-hover text-fg  " : "bg-success-subtle text-success-fg  "}
              title={m.type === "want" ? "A close substitute for a skill you have (counts 70%)" : "On your resume"}
            >
              {m.type === "want" ? "≈" : "✓"} {m.skill}
            </Tag>
          ))}
          {(o.missing || []).slice(0, 3).map((s) => (
            <Tag key={s} cls="bg-danger-subtle text-danger-fg  " title="Asked for, not on your resume">
              ✗ {s}
            </Tag>
          ))}
        </div>
      )}

      {o.snippet && <p className="text-[11px] leading-relaxed text-fg-subtle line-clamp-2">{plainText(o.snippet)}</p>}

      <div className="mt-auto pt-1 grid grid-cols-3 gap-1.5">
        <button onClick={onSkip} title="Not for me" className={`${ACTION} border border-line text-danger-fg hover:bg-surface-hover `}>
          <HiX className="w-3.5 h-3.5" /> Skip
        </button>
        <a
          href={o.url}
          target="_blank"
          rel="noreferrer"
          title="Open the listing on Naukri to apply"
          className={`${ACTION} border border-line-strong text-fg-muted hover:bg-surface-hover `}
        >
          <HiOutlineExternalLink className="w-3.5 h-3.5" /> Open
        </a>
        <button onClick={onApplied} title="I applied: add it to the pipeline as applied today" className={`${ACTION} bg-success hover:opacity-90 text-white`}>
          <HiCheck className="w-3.5 h-3.5" /> Applied
        </button>
      </div>
    </div>
  );
}

function Pager({ page, pages, from, to, total, onPage }) {
  const btn =
    "inline-flex items-center gap-0.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-line-strong text-fg-muted hover:bg-surface-hover disabled:opacity-40 disabled:pointer-events-none";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-fg-subtle">
        {from}–{to} of {total}
      </span>
      <button className={btn} disabled={page === 0} onClick={() => onPage(page - 1)}>
        <HiChevronLeft className="w-3.5 h-3.5" /> Previous {BATCH}
      </button>
      <button className={btn} disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
        Next {BATCH} <HiChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function OpeningsTab({ finderExt, queuedUrls, hidden, onHide, onUnhide, onUnhideAll, addJob, removeJob, addJobs, removeJobs }) {
  const [cached] = useState(readCache);
  const [radar, setRadar] = useState(cached?.data || null);
  const [loadedAt, setLoadedAt] = useState(cached?.at || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exp, setExp] = useState({ fits: true, unknown: true });
  const [pay, setPay] = useState(() => Object.fromEntries(Object.keys(PAY_LABEL).map((k) => [k, true])));
  const [source, setSource] = useState("all");
  const [newOnly, setNewOnly] = useState(false);
  const [listedOnly, setListedOnly] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("recent"); // "recent" | "score"
  const [modePref, setModePref] = useState(readMode); // "naukri" | "all", remembered on this device
  // Which list: picked on this visit, else the one this browser's job finder searches for (its
  // Naukri account), else the one picked last time on this device.
  const [profileChoice, setProfileChoice] = useState(null);
  const [savedProfile] = useState(readProfile);
  const extScope = finderExt?.present && (finderExt.scope === "backend" || finderExt.scope === "ai") ? finderExt.scope : null;
  const profileTab = profileChoice || extScope || savedProfile || "backend";
  const setProfileTab = (p) => {
    setProfileChoice(p);
    writeProfile(p);
  };

  // Fetch when there's no copy on this device or it's older than CACHE_TTL;
  // a copy that's there is shown meanwhile. `refresh` forces it.
  const [reloads, setReloads] = useState(0);
  const refresh = () => setReloads((n) => n + 1);
  useEffect(() => {
    if (reloads === 0 && cached && Date.now() - cached.at < CACHE_TTL) return undefined;
    let alive = true;
    setLoading(true);
    loadRadar()
      .then((d) => {
        if (!alive) return;
        setRadar(d);
        setLoadedAt(Date.now());
        setError(null);
        writeCache(d);
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [reloads, cached]);

  // A filter change starts again from the newest.
  useEffect(() => setPage(0), [exp, pay, source, newOnly, listedOnly, query, sort]);

  const openings = radar?.openings || [];
  const isNew = (o) => Date.now() - (o.firstSeen || 0) < NEW_HOURS * 3600000;
  const urlOf = (o) => normalizeUrl(o.url) || o.url;

  // The ones still to decide: not skipped, not already in the pipeline, and
  // through the filters. Most recent first (the API's order), or by score
  // (newest first among equal scores).
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = openings.filter(
      (o) =>
        relevant(o) &&
        !hidden[o.id] &&
        !queuedUrls.has(urlOf(o)) &&
        (!listedOnly || o.active) &&
        exp[o.exp || "unknown"] !== false &&
        pay[o.pay?.verdict || "unknown"] !== false &&
        (source === "all" || o.source === source || o.sources?.includes(source)) &&
        (!newOnly || isNew(o)) &&
        (!q || `${o.company} ${o.title} ${o.location}`.toLowerCase().includes(q))
    );
    // Array sort is stable, so equal scores keep the newest-first order.
    if (sort === "score") list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openings, hidden, queuedUrls, listedOnly, exp, pay, source, newOnly, query, sort]);

  const sources = useMemo(() => [...new Set(openings.flatMap((o) => o.sources || [o.source]))], [openings]);
  const hiddenCount = openings.filter((o) => hidden[o.id]).length;

  // Today's Naukri jobs from the job finder, per profile, best first. Ones already in the
  // pipeline (applied or To Apply) count toward the day's 50; skipped ones are gone.
  const today = todayKey();
  const finder = useMemo(() => {
    const out = {};
    for (const p of PROFILES) {
      const all = openings
        .filter((o) => o.finder === "naukri" && o.postedAt === today && (o.profile || "backend") === p.id && !hidden[o.id])
        .sort((a, b) => (b.rank || 0) - (a.rank || 0));
      const done = all.filter((o) => queuedUrls.has(urlOf(o))).length;
      const left = all.filter((o) => !queuedUrls.has(urlOf(o)));
      const room = Math.max(0, DAILY_TOP - done);
      out[p.id] = { found: all.length, done, list: left.slice(0, room), more: Math.max(0, left.length - room) };
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openings, hidden, queuedUrls, today]);
  const finderFound = finder.backend.found + finder.ai.found;
  const mode = modePref || (finderFound ? "naukri" : "all");
  const setMode = (m) => {
    setModePref(m);
    writeMode(m);
  };

  // An error only blocks the tab when there's nothing to show; otherwise the
  // header says the refresh failed and the copy stays up.
  if (error && !radar) {
    return (
      <div className={`${GLASS} rounded-lg p-8 text-center text-sm text-fg-subtle `}>
        {error === "not-found"
          ? "Openings are only available on the owner account."
          : "No radar data yet. It appears after the radar on your PC uploads its first run (scripts/radar/README.md)."}
        <div className="mt-1 text-xs text-fg-subtle">({error})</div>
      </div>
    );
  }
  if (!radar) return <div className={`${GLASS} rounded-lg p-8 text-center text-sm text-fg-subtle`}>Loading openings…</div>;

  const s = radar.summary || {};
  const toggle = (setter) => (k) => setter((prev) => ({ ...prev, [k]: !prev[k] }));

  // Deciding a card removes it from `shown`, so the batch refills from the next one.
  const pages = Math.max(1, Math.ceil(shown.length / BATCH));
  const current = Math.min(page, pages - 1);
  const batch = shown.slice(current * BATCH, current * BATCH + BATCH);
  const pager = (
    <Pager
      page={current}
      pages={pages}
      from={shown.length ? current * BATCH + 1 : 0}
      to={current * BATCH + batch.length}
      total={shown.length}
      onPage={(p) => {
        setPage(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    />
  );

  const undoToast = (text, undo) =>
    toast.info(
      ({ closeToast }) => (
        <span className="text-sm">
          {text}{" "}
          <button
            onClick={() => {
              undo();
              closeToast();
            }}
            className="underline font-semibold"
          >
            Undo
          </button>
        </span>
      ),
      { autoClose: 5000 }
    );

  const skip = (o) => {
    onHide(o.id);
    undoToast(
      <>
        Skipped <span className="font-semibold">{o.company}</span>
      </>,
      () => onUnhide(o.id)
    );
  };
  const apply = (o) => {
    const url = urlOf(o);
    if (!addJob({ companyName: o.company, url, role: o.title, stage: "toApply" })) return;
    undoToast(
      <>
        <span className="font-semibold">{o.company}</span> added to To Apply
      </>,
      () => removeJob({ companyName: o.company, url })
    );
  };

  // Every opening through the current filters (all pages), in one go.
  const applyAll = () => {
    const items = shown.map((o) => ({ companyName: o.company, url: urlOf(o), role: o.title, stage: "toApply" }));
    if (!items.length || !addJobs(items)) return;
    undoToast(
      <>
        <span className="font-semibold">{items.length} openings</span> added to To Apply
      </>,
      () => removeJobs(items)
    );
  };

  const markApplied = (o) => {
    const url = urlOf(o);
    if (!addJob({ companyName: o.company, url, role: o.title, stage: "applied" })) return;
    undoToast(
      <>
        <span className="font-semibold">{o.company}</span> marked applied
      </>,
      () => removeJob({ companyName: o.company, url })
    );
  };

  const modeSwitch = (
    <div className={`${GLASS_TRACK} rounded-lg p-1 inline-flex gap-1 mb-3`}>
      <Chip on={mode === "naukri"} onClick={() => setMode("naukri")} title={`Today's Naukri jobs from the job finder: the top ${DAILY_TOP} per profile`}>
        ⭐ Naukri today ({finder.backend.list.length + finder.ai.list.length})
      </Chip>
      <Chip on={mode === "all"} onClick={() => setMode("all")} title="Every opening the radar keeps (15 days)">
        📡 All openings ({shown.length})
      </Chip>
    </div>
  );

  if (mode === "naukri") {
    const fs = radar.finderSummary;
    const cur = finder[profileTab] || finder.backend;
    // When each browser's finder last sent: one per list it searches for (two browsers, two accounts).
    const runs = radar.finderRuns || {};
    const sent = ["backend", "ai", "both"]
      .filter((k) => runs[k]?.receivedAt)
      .map((k) => `${k === "both" ? "both lists" : `${profileLabel(k)} searches`} ${sentAt(runs[k].receivedAt)}${runs[k].browser ? ` (${runs[k].browser})` : ""}`);
    const sentLine = sent.length
      ? ` · sent: ${sent.join(", ")}`
      : fs?.receivedAt
        ? ` · job finder last sent ${sentAt(fs.receivedAt)}`
        : " · the job finder hasn't sent anything yet";
    // The job finder in this browser (finderBridge.js), when there is one.
    let extLine = null;
    if (finderExt?.present) {
      extLine = finderExt.connected
        ? `Job finder in this browser: connected, searches for ${SCOPE_TEXT[finderExt.scope] || SCOPE_TEXT.both}${finderExt.enabled ? "" : " (switched off in the extension)"}.`
        : `Job finder in this browser: not connected${finderExt.error ? ` (${finderExt.error})` : ""}.`;
    }
    return (
      <div>
        {modeSwitch}
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-brand-fg">⭐ Naukri today</h2>
          <div className="text-xs text-fg-subtle">
            {loading ? "Refreshing…" : error ? `Refresh failed (${error})` : loadedAt ? `Loaded ${minutesAgo(loadedAt)}` : ""}
            {!loading && (
              <button onClick={refresh} className="ml-1.5 font-semibold text-accent-fg hover:underline">
                Refresh
              </button>
            )}
            {sentLine}
          </div>
          <div className="text-xs text-fg-subtle">
            Two lists, one per Naukri account: Backend (backend-first roles, checked against your SDE resume) and AI (AI-first roles,
            checked against your GenAI resume). A job is on one list only. Posted today · asks for under 2.5 yrs · 15L+ or pay not shown ·
            at least 85% of the job's skills on that list's resume. Naukri allows {DAILY_TOP} applies a day per account.
          </div>
          {extLine && (
            <div className={`text-xs ${finderExt.connected ? "text-fg-subtle" : "text-warning-fg"}`}>{extLine}</div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className={`${GLASS_TRACK} rounded-lg p-1 inline-flex gap-1`}>
            {PROFILES.map((p) => (
              <Chip key={p.id} on={profileTab === p.id} onClick={() => setProfileTab(p.id)} title={p.hint}>
                {p.label} · {finder[p.id].done}/{DAILY_TOP} done · {finder[p.id].list.length} to go
              </Chip>
            ))}
          </div>
          {hiddenCount > 0 && (
            <button onClick={onUnhideAll} className="text-xs font-semibold text-accent-fg hover:underline">
              Bring back {hiddenCount} skipped
            </button>
          )}
        </div>

        {extScope && profileTab !== extScope && (
          <div className="mb-3 text-xs font-semibold text-warning-fg">
            This browser&apos;s job finder searches for the {profileLabel(extScope)} list, so its Naukri account is probably your{" "}
            {profileLabel(extScope)} one. Apply to these {profileLabel(profileTab)} jobs from your {profileLabel(profileTab)} account.
          </div>
        )}

        {cur.list.length === 0 ? (
          <div className={`${GLASS} rounded-lg p-8 text-center text-sm text-fg-subtle `}>
            {cur.done >= DAILY_TOP
              ? `That's ${DAILY_TOP} for today on this account.`
              : cur.found
                ? "All of today's jobs on this list are decided."
                : "No jobs on this list yet today. The job finder (in the Naukri Refresher extension) runs every 2 hours, 09:00–19:00 IST."}
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <AnimatePresence initial={false} mode="popLayout">
              {cur.list.map((o, i) => (
                <motion.div
                  key={o.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1, transition: { duration: 0.2 } }}
                  exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
                >
                  <FinderCard o={o} n={cur.done + i + 1} onSkip={() => skip(o)} onApplied={() => markApplied(o)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        {cur.more > 0 && (
          <div className="mt-3 text-xs text-fg-subtle text-center">
            {cur.more} more kept today beyond the top {DAILY_TOP}; they move up as you decide these.
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {modeSwitch}
      <div className="flex items-end justify-between flex-wrap gap-2 mb-3">
        <div>
          <h2 className="text-lg font-semibold text-brand-fg">
            📡 Openings to decide ({shown.length})
          </h2>
          <div className="text-xs text-fg-subtle">
            <span className="mr-2">
              {loading ? "Refreshing…" : error ? `Refresh failed (${error})` : loadedAt ? `Loaded ${minutesAgo(loadedAt)}` : ""}
              {!loading && (
                <button onClick={refresh} className="ml-1.5 font-semibold text-accent-fg hover:underline">
                  Refresh
                </button>
              )}
            </span>
            {s.created > 0 && <span className="font-semibold text-success-fg mr-2">{s.created} new in last run</span>}
            {s.receivedAt ? `scanned ${new Date(s.receivedAt).toLocaleString()}` : "never scanned"}
            {s.sources &&
              " · " +
                Object.entries(s.sources)
                  .map(([k, v]) => `${SOURCE_LABEL[k] || k} ${v.error ? "failed" : v.skipped ? "skipped" : v.fetched}`)
                  .join(", ")}
          </div>
          {s.resume && (
            <div className="text-xs text-fg-subtle" title={`Searched for: ${s.resume.searchTerms.join(" · ")}`}>
              Matched against your resume ({s.resume.skills} skills) · searched for “{s.resume.searchTerms.join("”, “")}”
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, role, city"
            className="text-sm px-2.5 py-1.5 rounded-lg border border-line-strong bg-canvas w-56"
          />
          {shown.length > 0 && (
            <button
              onClick={applyAll}
              title="Put every opening shown by these filters (all pages) in To Apply"
              className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg bg-success hover:opacity-90 text-white"
            >
              <HiCheck className="w-4 h-4" /> Add all {shown.length} to To Apply
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className={`${GLASS_TRACK} rounded-lg p-1 inline-flex gap-1`}>
          {Object.keys(EXP_LABEL).map((k) => (
            <Chip
              key={k}
              on={exp[k]}
              onClick={() => toggle(setExp)(k)}
              title={k === "fits" ? "The years it asks for include 2 (0–2, 1–3, 2–5, 1+…)" : "The posting doesn't say how many years"}
            >
              {EXP_LABEL[k]}
            </Chip>
          ))}
        </div>
        <div className={`${GLASS_TRACK} rounded-lg p-1 inline-flex gap-1`}>
          {Object.keys(PAY_LABEL).map((k) => (
            <Chip key={k} on={pay[k]} onClick={() => toggle(setPay)(k)} title={PAY_HINT[k]}>
              {PAY_LABEL[k]}
            </Chip>
          ))}
        </div>
        <div className={`${GLASS_TRACK} rounded-lg p-1 inline-flex gap-1`}>
          <Chip on={sort === "recent"} onClick={() => setSort("recent")} title="Newest opening first">
            Most recent
          </Chip>
          <Chip on={sort === "score"} onClick={() => setSort("score")} title="Highest skills match first">
            Highest score
          </Chip>
        </div>
        <div className={`${GLASS_TRACK} rounded-lg p-1 inline-flex gap-1`}>
          <Chip on={newOnly} onClick={() => setNewOnly((v) => !v)}>
            New only
          </Chip>
          <Chip
            on={listedOnly}
            onClick={() => setListedOnly((v) => !v)}
            title="Only openings a source still listed in the last week; off shows all 15 days kept"
          >
            Still listed
          </Chip>
        </div>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-line-strong bg-canvas"
        >
          <option value="all">All sources</option>
          {sources.map((k) => (
            <option key={k} value={k}>
              {SOURCE_LABEL[k] || k}
            </option>
          ))}
        </select>
        {hiddenCount > 0 && (
          <button onClick={onUnhideAll} className="text-xs font-semibold text-accent-fg hover:underline">
            Bring back {hiddenCount} skipped
          </button>
        )}
        {shown.length > BATCH && <div className="ml-auto">{pager}</div>}
      </div>

      {shown.length === 0 ? (
        <div className={`${GLASS} rounded-lg p-8 text-center text-sm text-fg-subtle `}>
          {openings.length ? "All decided. New openings arrive with the next radar run." : "Nothing matches these filters."}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <AnimatePresence initial={false} mode="popLayout">
            {batch.map((o) => (
              <motion.div
                key={o.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.2 } }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
              >
                <OpeningCard o={o} isNew={isNew(o)} onSkip={() => skip(o)} onApply={() => apply(o)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {shown.length > BATCH && <div className="mt-4 flex justify-center">{pager}</div>}
    </div>
  );
}
