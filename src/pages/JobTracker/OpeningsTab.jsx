import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";
import { HiOutlineExternalLink, HiCheck, HiX, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { GLASS, GLASS_TRACK, SEGMENT_ON, SEGMENT_OFF } from "../../components/glass";
import { normalizeUrl } from "./shared";
// The low-pay employers the radar and the job finder leave out (IT services and consulting firms).
import { lowPayMatch } from "../../../extensions/naukri-refresher/low-pay.js";
import { jobKeys, roleKey } from "./jobKeys";

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
// It's a triage board: BATCH cards at a time, highest score first (or newest
// first), each with its title, pay, years and skills right above its three
// buttons (skip, open, To Apply), so deciding takes no travel across the
// screen. A decided card leaves and the next one fills its place; "Next 20"
// moves past a batch without deciding it. "Add top 50" puts the TOP_N highest
// scores in To Apply at once. Every decision can be undone from its toast.

const BATCH = 20;
const TOP_N = 50; // "Add top 50": how many go to To Apply in one click
const byScore = (a, b) => (b.matchScore || 0) - (a.matchScore || 0);
const NEW_HOURS = 30; // "new" = first stored by a run in roughly the last day
const API_PAGE = 200; // openings per /api/radar request
const MAX_API_PAGES = 10;

// The radar keeps only openings whose asked range includes 2 years ("fits") or
// that don't say ("unknown"), from employers off the low-pay list (low-pay.js).
// Anything else still stored from older rules, and any 0 skills match, is
// hidden here until the next run deletes it.
const EXP_LABEL = { fits: "2 yrs in range", unknown: "yrs ?" };
const EXP_CLS = {
  fits: "bg-success-subtle text-success-fg  ",
  unknown: "bg-surface-hover text-fg-subtle  ",
};
const relevant = (o) => (o.exp === "fits" || o.exp === "unknown" || !o.exp) && o.matchScore > 0 && !lowPayMatch(o.company);

// "1–3 yrs", "2+ yrs", or null when the posting doesn't say.
function yearsText(o) {
  if (o.minYoe == null) return null;
  return o.maxYoe != null ? `${o.minYoe}–${o.maxYoe} yrs` : `${o.minYoe}+ yrs`;
}
// Pay against the 25 LPA minimum (scripts/radar/pay.mjs). Nothing that could
// reach it is dropped by the radar, so every label is shown by default.
const PAY_LABEL = {
  meets: "Preferred · 25L+",
  target: "Meets target · 20L+",
  negotiable: "Negotiable · 18L+",
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
  meets: "The salary reaches the preferred 25 LPA",
  target: "The salary reaches 20 LPA",
  negotiable: "The salary reaches the negotiable floor of 18 LPA",
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
  target: "bg-success-subtle text-success-fg",
  negotiable: "bg-surface-hover text-fg",
  fifteen: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
  hidden: "bg-surface-hover text-fg  ",
  likely: "bg-success-subtle text-success-fg  ",
  maybe: "bg-warning-subtle text-warning-fg  ",
  low: "bg-surface-hover text-fg  ",
  unlikely: "bg-danger-subtle text-danger-fg  ",
  unknown: "bg-surface-hover text-fg-subtle  ",
};

// The Naukri job finder (extensions/naukri-refresher) uploads its top 400 Naukri jobs per list with
// their JD match, a rank, the list they're on (one per Naukri account) and, once an LLM has read the
// JD against your resume, an AI rating (`ai`). Each list shows its top SHOW_TOP posted in the last
// WINDOW_HOURS hours that you haven't taken yet, highest AI rating first.
const WINDOW_HOURS = 48;
const SHOW_TOP = 100; // "Apply" on Naukri: the top 100 a list (Naukri takes 50 applies a day per account)
const SITE_BATCH = 60; // "Apply on company site": every one, 60 cards at a time
const HOUR_MS = 3600000;
// When a finder opening was posted: Naukri's own time, else when the finder first stored it.
const postedMs = (o) => o.postedTime || o.firstSeen || o.openedAt || 0;
// Highest JD match first. A JD that names only a few technologies says little about the fit, so
// those come after the ones that name enough, and one naming none comes last; the rank (title,
// experience, pay, company rating) breaks ties.
const matchTier = (o) => (o.coverage == null ? 2 : o.fewSkills ? 1 : 0);
const byMatch = (a, b) => matchTier(a) - matchTier(b) || (b.coverage || 0) - (a.coverage || 0) || (b.rank || 0) - (a.rank || 0);
// Rated jobs first, highest rating first (ties by JD match); the ones not rated yet after them.
const aiScore = (o) => (o.ai && o.ai.s >= 1 ? o.ai.s : 0);
const preferredPay = (o) => o.pay?.verdict === "meets" || o.ai?.pay?.ok === "ok";
const byRating = (a, b) => aiScore(b) - aiScore(a) || Number(preferredPay(b)) - Number(preferredPay(a)) || byMatch(a, b);
// Your site keeps AI ratings from 70 up (extensions/naukri-refresher/rate-lib.js RATE.minShow); the
// rest wait behind "Show N rated under 70". Jobs not rated yet still show, after the rated ones.
const MIN_SHOW = 70;
const finderMatch = (o) => o.ai?.v >= 3 && !o.ai.rej && aiScore(o) >= MIN_SHOW;
const lowRated = (o) => aiScore(o) > 0 && aiScore(o) < MIN_SHOW;
// What the AI rating rests on, for its tooltip.
const LEVEL_TEXT = { junior: "junior", mid: "mid-level", senior: "senior", lead: "lead" };
const PAY_FROM = { posted: "the salary it shows", web: "a web lookup of the company's pay at about 2 years", model: "what the LLM knows of the company", guess: "the LLM's guess (not counted)" };
function aiHint(ai) {
  const lines = [
    ai.rel != null
      ? `AI rating ${ai.s}/100: 55% the LLM's relevance against your list's strict rules (${ai.rel}), 45% the requirements your resume provably meets (${ai.fit}).`
      : `AI rating ${ai.s}/100: an LLM read the JD against your resume; the rating is worked out from what it found, with fixed weights.`,
    ai.rej ? "On your never-wanted list: 15 at most." : null,
    ai.why ? `Rating explanation: ${ai.why}` : null,
    ai.pay?.from ? `Pay at about 2 years: ${ai.pay.lo}–${ai.pay.hi} LPA, from ${PAY_FROM[ai.pay.from] || ai.pay.from}${ai.pay.ok === "low" ? " (under 18: the rating is held at 35)" : ""}.` : null,
    `Must-haves your resume shows: ${ai.m[0]} of ${ai.m[1]}.`,
    ai.have?.length ? `✓ ${ai.have.join(", ")}` : null,
    ai.part?.length ? `½ ${ai.part.join(", ")}` : null,
    ai.miss?.length ? `✗ ${ai.miss.join(", ")}` : null,
    `Role: ${ai.role}, ${LEVEL_TEXT[ai.lvl] || ai.lvl}${ai.yrs != null ? `, asks ${ai.yrs}+ years` : ""}.`,
    ai.uv ? `${ai.uv} claim${ai.uv === 1 ? "" : "s"} without a quote from your resume counted as not met.` : null,
    ai.thin ? "The JD names fewer than 3 requirements, so the rating is held at 75 or less." : null,
  ];
  return lines.filter(Boolean).join("\n");
}
const PROFILES = [
  { id: "backend", label: "Backend", hint: "Backend-first roles: apply from your Backend Naukri account" },
  { id: "ai", label: "AI", hint: "AI-first roles (GenAI work is a large share of the JD): apply from your AI Naukri account" },
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

// "just now" / "3 h ago" / "2 days ago" from epoch ms.
function hoursAgo(t) {
  if (!t) return "";
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 60) return m < 2 ? "just now" : `${m} min ago`;
  if (m < 24 * 60) return `${Math.floor(m / 60)} h ago`;
  const d = Math.floor(m / (24 * 60));
  return d === 1 ? "1 day ago" : `${d} days ago`;
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
const PAY_MATCH_CLS = { ok: "bg-success-subtle text-success-fg", close: "bg-surface-hover text-fg", low: "bg-danger-subtle text-danger-fg", unknown: "bg-surface-hover text-fg-subtle" };
const prettyJson = (t) => {
  try {
    return JSON.stringify(JSON.parse(t), null, 2);
  } catch (_) {
    return t;
  }
};

// The AI rating's one-line reason, its pay match, and the prompt it was sent with the LLM's raw
// answer (read from the API on demand: GET /api/radar?debug=<id>), for checking a rating.
function AiExtra({ o }) {
  const [open, setOpen] = useState(false);
  const [dbg, setDbg] = useState(null); // { loading } | { error } | { dbg }
  const ai = o.ai;
  if (!ai) return null;
  const p = ai.pay;
  const toggle = async () => {
    setOpen((v) => !v);
    if (open || (dbg && !dbg.error)) return;
    setDbg({ loading: true });
    try {
      const user = getAuth().currentUser;
      const token = user && (await user.getIdToken());
      const res = await fetch(`/api/radar?debug=${encodeURIComponent(o.id)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error || `HTTP ${res.status}`);
      setDbg({ dbg: data.dbg });
    } catch (e) {
      setDbg({ error: e.message });
    }
  };
  const d = dbg?.dbg;
  return (
    <div className="flex flex-col gap-1">
      {ai.why && (
        <p className={`text-[11px] leading-snug ${ai.rej ? "text-danger-fg" : "text-fg-muted"}`} title="The reason for the final rating">
          {ai.rej ? "✗ " : ""}
          {ai.why}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1">
        {ai.rel != null && (
          <Tag cls="bg-surface-hover text-fg" title="The LLM's relevance (1–100) against your list's strict prompt · the requirements score worked out in code">
            relevance {ai.rel} · fit {ai.fit}
          </Tag>
        )}
        {p?.from && (
          <Tag cls={PAY_MATCH_CLS[p.ok] || PAY_MATCH_CLS.unknown} title={`The company's pay at about 2 years, from ${PAY_FROM[p.from] || p.from}`}>
            {p.lo === p.hi ? `≈${p.hi}` : `${p.lo}–${p.hi}`} LPA{p.from === "guess" ? "?" : ""}{p.from === "web" ? " est." : ""}{({ok: " · Preferred", close: " · Meets target", flex: " · Negotiable"})[p.ok]}
          </Tag>
        )}
        <button onClick={toggle} className="text-[10px] font-semibold text-accent-fg hover:underline">
          {open ? "Hide prompt and answer" : "Prompt and answer"}
        </button>
      </div>
      {open && (
        <div className="rounded border border-line bg-canvas p-2 text-[10px] max-h-96 overflow-auto">
          {dbg?.loading ? (
            "Loading…"
          ) : dbg?.error ? (
            `Couldn't load it (${dbg.error}).`
          ) : !d ? (
            "Not kept for this rating: it was rated before prompts were kept. Start over in the job finder rates everything again."
          ) : (
            <>
              <div className="font-semibold text-fg-muted">
                Prompt sent to {d.m} {d.t ? `on ${new Date(d.t).toLocaleString()}` : ""}
              </div>
              <pre className="whitespace-pre-wrap break-words text-fg-subtle font-mono">{d.p}</pre>
              <div className="mt-2 font-semibold text-fg-muted">The LLM&apos;s answer</div>
              <pre className="whitespace-pre-wrap break-words text-fg-subtle font-mono">{prettyJson(d.o)}</pre>
              {d.pay && (
                <>
                  <div className="mt-2 font-semibold text-fg-muted">Pay lookup</div>
                  <pre className="whitespace-pre-wrap break-words text-fg-subtle font-mono">{d.pay}</pre>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

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
        {o.ai && (
          <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${scoreCls(o.ai.s)}`} title={aiHint(o.ai)}>
            AI {o.ai.s}
          </span>
        )}
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

      <AiExtra o={o} />

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
  // How many of the technologies its JD asks for are yours (or its card's chips, when the page couldn't be read).
  const skills = o.fewSkills
    ? o.skillsTotal
      ? `JD names just ${o.skillsTotal} · ${o.skillsHave} yours`
      : "JD names no skills"
    : o.coverage != null
      ? `${o.jd === false ? "card" : "JD"} ${o.skillsHave}/${o.skillsTotal} skills · ${o.coverage}%`
      : "skills ?";
  return (
    <div className={`${CARD} rounded-lg p-3.5 h-full flex flex-col gap-2`}>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="shrink-0 text-[11px] font-bold text-fg-muted tabular-nums">#{n}</span>
        {o.ai ? (
          <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${scoreCls(o.ai.s)}`} title={aiHint(o.ai)}>
            AI {o.ai.s}
          </span>
        ) : (
          <span
            className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-hover text-fg-subtle"
            title={`Not rated yet: listed after the rated jobs, by JD match. Rank ${o.rank} (skills match, title, experience, pay, company rating, how fresh).`}
          >
            not rated
          </span>
        )}
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
        {o.location || "India"} ·{" "}
        {o.apply === "company" ? (
          <span title="Its Naukri page says “Apply on company site”">apply on the company&apos;s site</span>
        ) : (
          <span title={profile.hint}>apply from your {profile.label} account</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        <Tag cls={EXP_CLS[o.exp] || EXP_CLS.unknown} title={years ? `Asks for ${years}` : "The listing doesn't say how many years"}>
          {years || EXP_LABEL.unknown}
        </Tag>
        <Tag cls={PAY_CLS[o.pay?.verdict] || PAY_CLS.unknown} title={[PAY_HINT[o.pay?.verdict], o.pay?.text].filter(Boolean).join("\n")}>
          {o.pay?.verdict === "unknown" ? "pay not shown" : o.pay?.text || PAY_LABEL.unknown}
          {["meets", "target", "negotiable"].includes(o.pay?.verdict) && " · " + ({meets: "Preferred", target: "Meets target", negotiable: "Negotiable"})[o.pay.verdict]}
        </Tag>
        <Tag
          cls={o.coverage >= 80 ? "bg-success-subtle text-success-fg  " : "bg-surface-hover text-fg  "}
          title={
            o.fewSkills
              ? "Its JD names only a few technologies, so the match says little: listed after the jobs whose JD names enough"
              : o.jd === false
                ? "Its job page couldn't be read: how many of the skills on its card are yours"
                : "How many of the technologies its JD asks for are on your resumes (nice-to-haves and company text left out)"
          }
        >
          {skills}
        </Tag>
      </div>

      {o.ai ? (
        // The requirements the AI rating found: shown by your resume, partly, or not.
        <div className="flex flex-wrap gap-1">
          {(o.ai.have || []).slice(0, 4).map((r) => (
            <Tag key={`h${r}`} cls="bg-success-subtle text-success-fg  " title="A must-have your resume shows (quoted from it)">
              ✓ {r}
            </Tag>
          ))}
          {(o.ai.part || []).slice(0, 2).map((r) => (
            <Tag key={`p${r}`} cls="bg-surface-hover text-fg  " title="Your resume shows something close, not the same">
              ½ {r}
            </Tag>
          ))}
          {(o.ai.miss || []).slice(0, 3).map((r) => (
            <Tag key={`m${r}`} cls="bg-danger-subtle text-danger-fg  " title="A must-have your resume doesn't show">
              ✗ {r}
            </Tag>
          ))}
        </div>
      ) : (
        (o.matched?.length > 0 || o.missing?.length > 0) && (
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
        )
      )}

      <AiExtra o={o} />

      {o.snippet && <p className="text-[11px] leading-relaxed text-fg-subtle line-clamp-2">{plainText(o.snippet)}</p>}

      <div className="mt-auto pt-1 grid grid-cols-3 gap-1.5">
        <button onClick={onSkip} title="Not for me" className={`${ACTION} border border-line text-danger-fg hover:bg-surface-hover `}>
          <HiX className="w-3.5 h-3.5" /> Skip
        </button>
        <a
          href={o.apply === "company" && o.applyUrl ? o.applyUrl : o.url}
          target="_blank"
          rel="noreferrer"
          title={o.apply === "company" && o.applyUrl ? "Open the job on the company's own site, to apply there" : "Open the listing on Naukri to apply"}
          className={`${ACTION} border border-line-strong text-fg-muted hover:bg-surface-hover `}
        >
          <HiOutlineExternalLink className="w-3.5 h-3.5" /> {o.apply === "company" && o.applyUrl ? "Company site" : "Open"}
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

export default function OpeningsTab({ finderExt, queuedUrls, takenRoles, dismissedUrls, hidden, onHide, onUnhide, onUnhideAll, addJob, removeJob, addJobs, removeJobs }) {
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
  const [reviewFinder, setReviewFinder] = useState(false);
  const [showLow, setShowLow] = useState(false); // AI ratings under MIN_SHOW: hidden unless asked for
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("score"); // "score" | "recent"
  const [modePref, setModePref] = useState(readMode); // "naukri" | "all", remembered on this device
  // Which list: picked on this visit, else the one this browser's job finder searches for (its
  // Naukri account), else the one picked last time on this device.
  const [profileChoice, setProfileChoice] = useState(null);
  const [applyTab, setApplyTab] = useState(null); // ⭐ Naukri: "naukri" | "company" once you pick one; until then whichever list has jobs
  const [siteShown, setSiteShown] = useState(SITE_BATCH);
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

  // A filter change starts again from the first page.
  useEffect(() => setPage(0), [exp, pay, source, newOnly, listedOnly, query, sort, showLow]);

  const openings = radar?.openings || [];
  const isNew = (o) => Date.now() - (o.firstSeen || 0) < NEW_HOURS * 3600000;
  const urlOf = (o) => normalizeUrl(o.url) || o.url;

  // The ones still to decide: not skipped, not already in the pipeline, and
  // through the filters. Highest score first (newest first among equal
  // scores), or most recent first (the API's order).
  // Each job shows in one view only. The job finder's Naukri jobs from the last 48 hours are the
  // ⭐ Naukri view; 📡 All openings leaves those out, the finder's older Naukri-only jobs, and any
  // other copy of a ⭐ Naukri job (another board, or the radar's own Naukri search), matched by
  // Naukri id, link, or company and title (jobKeys.js). A job already in your pipeline under the
  // same company and title stays out of both.
  const hour = Math.floor(Date.now() / HOUR_MS); // recomputed as the window moves on
  const naukri = useMemo(() => {
    const since = Date.now() - WINDOW_HOURS * HOUR_MS;
    const list = openings.filter((o) => o.finder === "naukri" && postedMs(o) >= since && !lowPayMatch(o.company));
    return { list, ids: new Set(list.map((o) => o.id)), keys: new Set(list.flatMap(jobKeys)) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openings, hour]);
  const taken = (o) => queuedUrls.has(urlOf(o)) || (!!takenRoles && takenRoles.has(roleKey(o.company, o.title)));

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = openings.filter(
      (o) =>
        !naukri.ids.has(o.id) &&
        !(o.finder === "naukri" && !(o.sources || []).some((src) => src !== "naukri")) &&
        !jobKeys(o).some((k) => naukri.keys.has(k)) &&
        relevant(o) &&
        !hidden[o.id] &&
        !taken(o) &&
        !dismissedUrls.has(urlOf(o)) &&
        (!listedOnly || o.active) &&
        exp[o.exp || "unknown"] !== false &&
        pay[o.pay?.verdict || "unknown"] !== false &&
        (source === "all" || o.source === source || o.sources?.includes(source)) &&
        (!newOnly || isNew(o)) &&
        (!q || `${o.company} ${o.title} ${o.location}`.toLowerCase().includes(q))
    );
    // Array sort is stable, so equal scores keep the newest-first order. Highest score: the AI
    // rating first (rated ones before the rest), then the skills match.
    if (sort === "score") list.sort((a, b) => aiScore(b) - aiScore(a) || byScore(a, b));
    const low = list.filter(lowRated).length;
    const out = showLow ? list : list.filter((o) => !lowRated(o));
    out.low = low;
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openings, naukri, hidden, queuedUrls, takenRoles, dismissedUrls, listedOnly, exp, pay, source, newOnly, query, sort, showLow]);

  const sources = useMemo(() => [...new Set(openings.flatMap((o) => o.sources || [o.source]))], [openings]);
  const hiddenCount = openings.filter((o) => hidden[o.id]).length;

  // The job finder's Naukri jobs from the last 48 hours, per list, highest AI rating first. Ones
  // you've taken (applied, in the pipeline) or skipped are left out; the top SHOW_TOP of the rest show.
  const finder = useMemo(() => {
    const out = {};
    for (const p of PROFILES) {
      // One card per job: a repost, or the same job found twice, is one job, shown as its
      // best-rated copy. Skip or take any copy and the job is skipped or taken.
      const groups = [];
      const groupOf = new Map();
      for (const o of naukri.list.filter((x) => (x.profile || "backend") === p.id).sort((a, b) => Number(finderMatch(b)) - Number(finderMatch(a)) || byRating(a, b))) {
        const keys = jobKeys(o);
        let g = keys.map((k) => groupOf.get(k)).find(Boolean);
        if (!g) {
          g = { best: o, skipped: false, taken: false };
          groups.push(g);
        }
        for (const k of keys) groupOf.set(k, g);
        if (hidden[o.id] || dismissedUrls.has(urlOf(o))) g.skipped = true;
        if (taken(o)) g.taken = true;
      }
      // Two lists per account: "Apply" on Naukri (it takes 50 applies a day per account, so the top
      // SHOW_TOP show) and "Apply on company site" (as many as there are).
      const live = groups.filter((g) => !g.skipped);
      const part = (company) => {
        const mine = live.filter((g) => (g.best.apply === "company") === company);
        const open = mine.filter((g) => !g.taken).map((g) => g.best);
        const matches = open.filter(finderMatch);
        const review = open.length - matches.length;
        const left = reviewFinder ? open.filter((o) => !finderMatch(o)) : matches;
        const top = company ? left : left.slice(0, SHOW_TOP);
        return { found: mine.length, done: mine.length - open.length, rated: left.filter((o) => aiScore(o) > 0).length, review, list: top, more: left.length - top.length };
      };
      const naukriPart = part(false);
      const sitePart = part(true);
      out[p.id] = { naukri: naukriPart, company: sitePart, found: naukriPart.found + sitePart.found };
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naukri, hidden, queuedUrls, takenRoles, dismissedUrls, reviewFinder]);
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
  // An opening as a pipeline job. One from the Naukri job finder keeps its list, so the
  // Pipeline says which Naukri account to apply from.
  const jobOf = (o, stage) => ({
    companyName: o.company,
    url: urlOf(o),
    role: o.title,
    stage,
    ...(o.finder === "naukri" ? { naukriAccount: o.profile || "backend" } : {}),
  });

  const apply = (o) => {
    const url = urlOf(o);
    if (!addJob(jobOf(o, "toApply"))) return;
    undoToast(
      <>
        <span className="font-semibold">{o.company}</span> added to To Apply
      </>,
      () => removeJob({ companyName: o.company, url })
    );
  };

  // Many openings into To Apply in one write, undone together from the toast.
  const addToApply = (list, what) => {
    const items = list.map((o) => jobOf(o, "toApply"));
    if (!items.length || !addJobs(items)) return;
    undoToast(
      <>
        <span className="font-semibold">
          {items.length} {what}
        </span>{" "}
        added to To Apply
      </>,
      () => removeJobs(items)
    );
  };
  // Every opening through the current filters (all pages), in one go.
  const applyAll = () => addToApply(shown, "openings");
  // The TOP_N highest scores through the current filters, whichever order the cards are in.
  // The sort is stable, so among equal scores the newest go first, as on the cards.
  const topScored = sort === "score" ? shown.slice(0, TOP_N) : [...shown].sort(byScore).slice(0, TOP_N);
  const applyTop = () => addToApply(topScored, "top-scored openings");

  const markApplied = (o) => {
    const url = urlOf(o);
    if (!addJob(jobOf(o, "applied"))) return;
    undoToast(
      <>
        <span className="font-semibold">{o.company}</span> marked applied
      </>,
      () => removeJob({ companyName: o.company, url })
    );
  };

  const modeSwitch = (
    <div className={`${GLASS_TRACK} rounded-lg p-1 inline-flex gap-1 mb-3`}>
      <Chip
        on={mode === "naukri"}
        onClick={() => setMode("naukri")}
        title={`The job finder's Naukri jobs from the last ${WINDOW_HOURS} hours that you haven't taken: the top ${SHOW_TOP} per list, highest AI rating first`}
      >
        ⭐ Naukri, last {WINDOW_HOURS} hours ({PROFILES.reduce((n, p) => n + finder[p.id].naukri.list.length + finder[p.id].company.list.length, 0)})
      </Chip>
      <Chip on={mode === "all"} onClick={() => setMode("all")} title="Every opening the radar keeps (15 days)">
        📡 All openings ({shown.length})
      </Chip>
    </div>
  );

  if (mode === "naukri") {
    const fs = radar.finderSummary;
    const lists = finder[profileTab] || finder.backend;
    // Opens on "Apply on Naukri", or on the company-site list when that one is empty and this isn't.
    const tabKey = applyTab || (lists.naukri.list.length === 0 && lists.company.list.length > 0 ? "company" : "naukri");
    const cur = lists[tabKey];
    const onSite = tabKey === "company";
    const visible = onSite ? cur.list.slice(0, siteShown) : cur.list;
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
          <h2 className="text-lg font-semibold text-brand-fg">⭐ Naukri, last {WINDOW_HOURS} hours</h2>
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
            Two lists, one per Naukri account: Backend (Java/Spring Boot roles) and AI (Python and GenAI roles: LLMs, RAG, agents,
            LangChain, LangGraph, FastAPI). A job is on one list only; frontend-first, MERN and other-stack roles are left out, and so are IT
            services firms that pay far under your bar. Posted in the last {WINDOW_HOURS} hours · not applied or taken yet · asks for
            under 2.5 yrs · 18L+ or pay not shown (20L target, 25L preferred) · the finder read its JD and enough of the technologies it asks for are yours. The
            finder reads every page of every search, and jobs with readable descriptions can receive a 1–100 rating against the selected profile summary. Each list
            shows two lists: Apply on Naukri (its top {SHOW_TOP}: Naukri takes 50 applies a day per account) and Apply on company site (all
            of them). Matches need a current rating of 70 or higher. Other candidates are available for review.
          </div>
          {extLine && (
            <div className={`text-xs ${finderExt.connected ? "text-fg-subtle" : "text-warning-fg"}`}>{extLine}</div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className={`${GLASS_TRACK} rounded-lg p-1 inline-flex gap-1`}>
            {PROFILES.map((p) => (
              <Chip key={p.id} on={profileTab === p.id} onClick={() => setProfileTab(p.id)} title={p.hint}>
                {p.label} · {finder[p.id].naukri.list.length} on Naukri · {finder[p.id].company.list.length} on company sites
              </Chip>
            ))}
          </div>
          <div className={`${GLASS_TRACK} rounded-lg p-1 inline-flex gap-1`}>
            <Chip
              on={!onSite}
              onClick={() => setApplyTab("naukri")}
              title={`Jobs you apply to on Naukri itself. Naukri takes 50 applies a day per account, so the top ${SHOW_TOP} show, highest rating first.`}
            >
              Apply on Naukri · {lists.naukri.list.length}
            </Chip>
            <Chip on={onSite} onClick={() => setApplyTab("company")} title="Jobs whose Naukri page says “Apply on company site”: no Naukri limit, so all of them show, highest rating first">
              Apply on company site · {lists.company.list.length}
            </Chip>
          </div>
          <span className="text-xs text-fg-subtle">
            {cur.done} taken · {cur.rated} rated
          </span>
          {(cur.review > 0 || reviewFinder) && (
            <button onClick={() => setReviewFinder((v) => !v)} className="text-xs font-semibold text-accent-fg hover:underline">
              {reviewFinder ? "Back to matches" : "Review other candidates (" + cur.review + ")"}
            </button>
          )}
          {hiddenCount > 0 && (
            <button onClick={onUnhideAll} className="text-xs font-semibold text-accent-fg hover:underline">
              Bring back {hiddenCount} skipped
            </button>
          )}
          {!reviewFinder && cur.list.length > 0 && (
            <button
              onClick={() => addToApply(cur.list.slice(0, TOP_N), `${profileLabel(profileTab)} jobs`)}
              title={`Put the ${Math.min(TOP_N, cur.list.length)} highest-rated jobs on this list (#1–#${Math.min(TOP_N, cur.list.length)}) in To Apply.${onSite ? " Apply on each company's site." : ` Apply to them from your ${profileLabel(profileTab)} Naukri account.`}`}
              className="ml-auto inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg bg-success hover:opacity-90 text-white"
            >
              <HiCheck className="w-4 h-4" /> Add top {Math.min(TOP_N, cur.list.length)} {profileLabel(profileTab)} to To Apply
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
            {cur.found
              ? (reviewFinder ? "No other candidates to review on this list." : "No available jobs on this list meet the current match criteria yet.")
              : lists.found
                ? onSite
                  ? "No company-site jobs on this list right now: they're all applied on Naukri."
                  : "No Naukri-apply jobs on this list right now: they're all applied on the company's site."
              : "No jobs on this list from the last 48 hours yet. The job finder (in the Naukri Refresher extension) runs every day around 17:00 IST, until it has read every listing of the last 48 hours, and sends what it keeps as it goes."}
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <AnimatePresence initial={false} mode="popLayout">
              {visible.map((o, i) => (
                <motion.div
                  key={o.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1, transition: { duration: 0.2 } }}
                  exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
                >
                  <FinderCard o={o} n={i + 1} onSkip={() => skip(o)} onApplied={() => markApplied(o)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        {cur.more > 0 && (
          <div className="mt-3 text-xs text-fg-subtle text-center">
            {cur.more} more on this list beyond the top {SHOW_TOP}; they move up as you take or skip these.
          </div>
        )}
        {onSite && visible.length < cur.list.length && (
          <div className="mt-3 text-center">
            <button onClick={() => setSiteShown((n) => n + SITE_BATCH)} className="text-xs font-semibold text-accent-fg hover:underline">
              Show {Math.min(SITE_BATCH, cur.list.length - visible.length)} more of {cur.list.length - visible.length}
            </button>
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
          {shown.length > TOP_N && (
            <button
              onClick={applyTop}
              title={`Put the ${TOP_N} highest-scored openings shown by these filters in To Apply`}
              className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg bg-success hover:opacity-90 text-white"
            >
              <HiCheck className="w-4 h-4" /> Add top {TOP_N} to To Apply
            </button>
          )}
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
          <Chip on={sort === "score"} onClick={() => setSort("score")} title="Highest AI rating first, then the highest skills match">
            Highest score
          </Chip>
        </div>
        <div className={`${GLASS_TRACK} rounded-lg p-1 inline-flex gap-1`}>
          <Chip on={newOnly} onClick={() => setNewOnly((v) => !v)}>
            New only
          </Chip>
          <Chip
            on={!showLow}
            onClick={() => setShowLow((v) => !v)}
            title={`Hide openings the AI rated under ${MIN_SHOW}${shown.low ? ` (${shown.low} now)` : ""}; off shows them too. Ones not rated yet always show.`}
          >
            AI {MIN_SHOW}+{!showLow && shown.low ? ` · ${shown.low} hidden` : ""}
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
