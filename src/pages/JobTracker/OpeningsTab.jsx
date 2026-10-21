import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";
import { HiOutlineExternalLink, HiCheck, HiX, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { GLASS, GLASS_TRACK, SEGMENT_ON, SEGMENT_OFF } from "../../components/glass";
import { normalizeUrl } from "./shared";

// Owner-only feed from the job radar (scripts/radar/run.mjs). The radar runs on
// the owner's PC five times a day and POSTs to /api/radar, which keeps the openings
// of the last 15 days in Firestore; this tab reads them back, page by page.
// Each opening has already passed the radar's checks: backend title in India,
// a years range that includes 2, a skills match above 0, and no posted salary
// topping out under 22 LPA. The pay label says how likely it is to reach the
// 25 LPA minimum.
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
  fits: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  unknown: "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400",
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
  likely: "25L+ likely",
  maybe: "pay maybe",
  low: "pay low",
  unlikely: "pay unlikely",
  unknown: "pay ?",
};
const PAY_HINT = {
  meets: "The posted salary reaches 25L",
  close: "Posted salary tops out at 22–25L, or a figure from the description text",
  likely: "levels.fyi: a quarter of this company's India engineers earn 25L+ even at its 25th percentile",
  maybe: "levels.fyi: this company's India median is 25L+",
  low: "levels.fyi: median under 25L, but its top 10% earn 25L+",
  unlikely: "levels.fyi: even this company's top 10% in India earn under 25L",
  unknown: "No pay data",
};
const PAY_CLS = {
  meets: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  close: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
  likely: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  maybe: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  low: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  unlikely: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  unknown: "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400",
};
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
  "bg-white dark:bg-[#121a30] border border-gray-200/90 dark:border-white/[0.09] shadow-[0_6px_18px_-10px_rgba(15,23,42,0.35)] dark:shadow-[0_8px_22px_-8px_rgba(0,0,0,0.7)] light:border-slate-900/[0.08] light:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_-4px_rgba(15,23,42,0.07)]";
const ACTION = "inline-flex items-center justify-center gap-1 text-xs font-bold py-2 rounded-lg transition-colors";

function scoreCls(s) {
  if (s >= 70) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200";
  if (s >= 45) return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200";
  if (s >= 25) return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200";
  return "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400";
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

// Every stored opening (newest first), following the API's page cursor.
async function loadRadar() {
  const user = getAuth().currentUser;
  const token = user && (await user.getIdToken());
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const openings = [];
  let summary = null;
  let cursor = null;
  for (let page = 0; page < MAX_API_PAGES; page++) {
    const q = `?limit=${API_PAGE}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const res = await fetch(`/api/radar${q}`, { headers });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) throw new Error(data?.error || `HTTP ${res.status}`);
    if (page === 0) summary = data.summary;
    openings.push(...data.openings);
    cursor = data.nextCursor;
    if (!cursor) break;
  }
  return { summary, openings };
}

function Chip({ on, onClick, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
        on ? `bg-indigo-600 text-white ${SEGMENT_ON}` : `text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 ${SEGMENT_OFF}`
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
    <div className={`${CARD} rounded-xl p-3.5 h-full flex flex-col gap-2`}>
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${scoreCls(o.matchScore)}`}
          title="How much of the tech this job asks for is on your resume"
        >
          {o.matchScore}% match
        </span>
        {isNew && <Tag cls="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200">NEW</Tag>}
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 light:text-slate-800 truncate">{o.company}</span>
        <span className="ml-auto shrink-0 text-[10px] text-gray-400 dark:text-gray-500">{ago(o.openedAt)}</span>
      </div>

      <a
        href={o.url}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-semibold leading-snug text-indigo-600 dark:text-indigo-300 light:text-slate-900 hover:underline line-clamp-2"
        title={o.title}
      >
        {o.title}
      </a>
      <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate" title={o.location}>
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
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              }
              title={m.type === "want" ? "A skill you want to grow into" : "On your resume"}
            >
              {m.type === "want" ? "↗" : "✓"} {m.skill}
            </Tag>
          ))}
          {(o.missing || []).slice(0, 3).map((s) => (
            <Tag key={s} cls="bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300" title="Asked for, not on your resume">
              ✗ {s}
            </Tag>
          ))}
        </div>
      )}

      {o.snippet && <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">{plainText(o.snippet)}</p>}

      <div className="mt-auto pt-1 grid grid-cols-3 gap-1.5">
        <button
          onClick={onSkip}
          title="Not for me"
          className={`${ACTION} border border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10`}
        >
          <HiX className="w-3.5 h-3.5" /> Skip
        </button>
        <a
          href={o.url}
          target="_blank"
          rel="noreferrer"
          title="Open the posting in a new tab"
          className={`${ACTION} border border-gray-300 dark:border-white/20 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05]`}
        >
          <HiOutlineExternalLink className="w-3.5 h-3.5" /> Open
        </a>
        <button onClick={onApply} title="Save in To Apply" className={`${ACTION} bg-emerald-600 hover:bg-emerald-700 text-white`}>
          <HiCheck className="w-3.5 h-3.5" /> To Apply
        </button>
      </div>
    </div>
  );
}

function Pager({ page, pages, from, to, total, onPage }) {
  const btn =
    "inline-flex items-center gap-0.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-white/15 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] disabled:opacity-40 disabled:pointer-events-none";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400">
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

export default function OpeningsTab({ queuedUrls, hidden, onHide, onUnhide, onUnhideAll, addJob, removeJob }) {
  const [radar, setRadar] = useState(null);
  const [error, setError] = useState(null);
  const [exp, setExp] = useState({ fits: true, unknown: true });
  const [pay, setPay] = useState(() => Object.fromEntries(Object.keys(PAY_LABEL).map((k) => [k, true])));
  const [source, setSource] = useState("all");
  const [newOnly, setNewOnly] = useState(false);
  const [listedOnly, setListedOnly] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    let alive = true;
    loadRadar()
      .then((d) => alive && setRadar(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  // A filter change starts again from the newest.
  useEffect(() => setPage(0), [exp, pay, source, newOnly, listedOnly, query]);

  const openings = radar?.openings || [];
  const isNew = (o) => Date.now() - (o.firstSeen || 0) < NEW_HOURS * 3600000;
  const urlOf = (o) => normalizeUrl(o.url) || o.url;

  // The ones still to decide, newest first (the API's order): not skipped,
  // not already in the pipeline, and through the filters.
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return openings.filter(
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openings, hidden, queuedUrls, listedOnly, exp, pay, source, newOnly, query]);

  const sources = useMemo(() => [...new Set(openings.flatMap((o) => o.sources || [o.source]))], [openings]);
  const hiddenCount = openings.filter((o) => hidden[o.id]).length;

  if (error) {
    return (
      <div className={`${GLASS} rounded-xl p-8 text-center text-sm text-gray-500 dark:text-gray-400`}>
        {error === "not-found"
          ? "Openings are only available on the owner account."
          : "No radar data yet. It appears after the radar on your PC uploads its first run (scripts/radar/README.md)."}
        <div className="mt-1 text-xs text-gray-400">({error})</div>
      </div>
    );
  }
  if (!radar) return <div className={`${GLASS} rounded-xl p-8 text-center text-sm text-gray-400`}>Loading openings…</div>;

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

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-2 mb-3">
        <div>
          <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-300 light:text-slate-900">
            📡 Openings to decide ({shown.length})
          </h2>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {s.created > 0 && <span className="font-bold text-emerald-600 dark:text-emerald-300 mr-2">{s.created} new in last run</span>}
            {s.receivedAt ? `scanned ${new Date(s.receivedAt).toLocaleString()}` : "never scanned"}
            {s.sources &&
              " · " +
                Object.entries(s.sources)
                  .map(([k, v]) => `${SOURCE_LABEL[k] || k} ${v.error ? "failed" : v.skipped ? "skipped" : v.fetched}`)
                  .join(", ")}
          </div>
          {s.resume && (
            <div className="text-xs text-gray-400 dark:text-gray-500" title={`Searched for: ${s.resume.searchTerms.join(" · ")}`}>
              Matched against your resume ({s.resume.skills} skills) · searched for “{s.resume.searchTerms.join("”, “")}”
            </div>
          )}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search company, role, city"
          className="text-sm px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100 w-56"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className={`${GLASS_TRACK} rounded-xl p-1 inline-flex gap-1`}>
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
        <div className={`${GLASS_TRACK} rounded-xl p-1 inline-flex gap-1`}>
          {Object.keys(PAY_LABEL).map((k) => (
            <Chip key={k} on={pay[k]} onClick={() => toggle(setPay)(k)} title={PAY_HINT[k]}>
              {PAY_LABEL[k]}
            </Chip>
          ))}
        </div>
        <div className={`${GLASS_TRACK} rounded-xl p-1 inline-flex gap-1`}>
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
          className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100"
        >
          <option value="all">All sources</option>
          {sources.map((k) => (
            <option key={k} value={k}>
              {SOURCE_LABEL[k] || k}
            </option>
          ))}
        </select>
        {hiddenCount > 0 && (
          <button onClick={onUnhideAll} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Bring back {hiddenCount} skipped
          </button>
        )}
        {shown.length > BATCH && <div className="ml-auto">{pager}</div>}
      </div>

      {shown.length === 0 ? (
        <div className={`${GLASS} rounded-xl p-8 text-center text-sm text-gray-400 dark:text-gray-500`}>
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
