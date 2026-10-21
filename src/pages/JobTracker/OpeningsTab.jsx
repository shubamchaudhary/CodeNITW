import React, { useEffect, useMemo, useState } from "react";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";
import { HiX } from "react-icons/hi";
import { GLASS, GLASS_PANEL, GLASS_TRACK, SEGMENT_ON, SEGMENT_OFF } from "../../components/glass";
import { normalizeUrl } from "./shared";

// Owner-only feed from the job radar (scripts/radar/run.mjs). The radar runs on
// the owner's PC five times a day and POSTs to /api/radar, which keeps the openings
// of the last 15 days in Firestore; this tab reads them back, page by page.
// Each opening has already passed the radar's checks: backend title in India,
// at most 3 years asked, and no posted salary topping out under 22 LPA. The pay
// label says how likely it is to reach the 25 LPA minimum.

const PAGE = 60;
const NEW_HOURS = 30; // "new" = first stored by a run in roughly the last day
const API_PAGE = 200; // openings per /api/radar request
const MAX_API_PAGES = 10;

const EXP_LABEL = { fits: "≤2 yrs", stretch: "3 yrs", unknown: "yrs ?" };
const EXP_CLS = {
  fits: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  stretch: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  unknown: "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400",
};
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

// Hover text for the skills-match score: what it shares with your resume, and
// what it asks for that the resume doesn't mention.
function matchTitle(o) {
  const parts = [];
  if (o.matched?.length) parts.push("On your resume: " + o.matched.map((m) => m.skill).join(", "));
  if (o.missing?.length) parts.push("Not on your resume: " + o.missing.join(", "));
  return parts.join("\n") || "Skills match with your resume";
}

function scoreCls(s) {
  if (s >= 70) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200";
  if (s >= 45) return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200";
  if (s >= 25) return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200";
  return "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400";
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

export default function OpeningsTab({ queuedUrls, hidden, onHide, onUnhideAll, addJob }) {
  const [radar, setRadar] = useState(null);
  const [error, setError] = useState(null);
  const [exp, setExp] = useState({ fits: true, stretch: true, unknown: true });
  const [pay, setPay] = useState(() => Object.fromEntries(Object.keys(PAY_LABEL).map((k) => [k, true])));
  const [source, setSource] = useState("all");
  const [newOnly, setNewOnly] = useState(false);
  const [listedOnly, setListedOnly] = useState(true);
  const [sort, setSort] = useState("new");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    let alive = true;
    loadRadar()
      .then((d) => alive && setRadar(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  const openings = radar?.openings || [];
  const isNew = (o) => Date.now() - (o.firstSeen || 0) < NEW_HOURS * 3600000;

  // The API already returns newest-opened first.
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = openings.filter(
      (o) =>
        !hidden[o.id] &&
        (!listedOnly || o.active) &&
        exp[o.exp || "unknown"] !== false &&
        pay[o.pay?.verdict || "unknown"] !== false &&
        (source === "all" || o.source === source || o.sources?.includes(source)) &&
        (!newOnly || isNew(o)) &&
        (!q || `${o.company} ${o.title} ${o.location}`.toLowerCase().includes(q))
    );
    if (sort === "match") list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openings, hidden, listedOnly, exp, pay, source, newOnly, sort, query]);

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

  const track = (o) => {
    if (addJob({ companyName: o.company, url: normalizeUrl(o.url) || o.url, role: o.title, stage: "toApply" })) {
      toast.success(`Added to To Apply: ${o.company}`);
    }
  };

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-2 mb-3">
        <div>
          <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-300 light:text-slate-900">
            📡 Openings ({shown.length})
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
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, role, city"
            className="text-sm px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100 w-56"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100"
          >
            <option value="new">Newest</option>
            <option value="match">Best skills match</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className={`${GLASS_TRACK} rounded-xl p-1 inline-flex gap-1`}>
          {Object.keys(EXP_LABEL).map((k) => (
            <Chip key={k} on={exp[k]} onClick={() => toggle(setExp)(k)} title="Years of experience the posting asks for">
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
            Show {hiddenCount} hidden
          </button>
        )}
      </div>

      <ul className="space-y-1.5">
        {shown.slice(0, limit).map((o) => {
          const queued = queuedUrls.has(normalizeUrl(o.url) || o.url);
          return (
            <li key={o.id} className={`${GLASS_PANEL} rounded-xl px-3 py-2 flex items-center gap-2 text-sm`}>
              {isNew(o) && (
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200 shrink-0">
                  NEW
                </span>
              )}
              {o.matchScore != null && (
                <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${scoreCls(o.matchScore)}`} title={matchTitle(o)}>
                  {o.matchScore}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <a
                  href={o.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
                  title={o.snippet || o.title}
                >
                  {o.title}
                </a>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{o.company}</span>
                  {o.location && ` · ${o.location}`}
                  {` · ${(o.sources || [o.source]).map((k) => SOURCE_LABEL[k] || k).join(" + ")}`}
                  {` · ${o.postedAt ? "posted" : "first seen"} ${ago(o.openedAt)}`}
                </div>
              </div>
              <span
                className={`hidden sm:inline shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${EXP_CLS[o.exp] || EXP_CLS.unknown}`}
                title={o.minYoe != null ? `Asks for ${o.minYoe}+ years` : "Experience not stated"}
              >
                {o.minYoe != null ? `${o.minYoe}+ yrs` : EXP_LABEL.unknown}
              </span>
              <span
                className={`hidden sm:inline shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${PAY_CLS[o.pay?.verdict] || PAY_CLS.unknown}`}
                title={[PAY_HINT[o.pay?.verdict], o.pay?.text].filter(Boolean).join("\n") || PAY_HINT.unknown}
              >
                {PAY_LABEL[o.pay?.verdict] || PAY_LABEL.unknown}
              </span>
              {queued ? (
                <span className="shrink-0 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">✓ queued</span>
              ) : (
                <button
                  onClick={() => track(o)}
                  className="shrink-0 text-[11px] font-semibold px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                  title="Save this link in To Apply"
                >
                  → To Apply
                </button>
              )}
              <button onClick={() => onHide(o.id)} className="shrink-0 text-gray-400 hover:text-red-500" title="Not for me — hide">
                <HiX />
              </button>
            </li>
          );
        })}
      </ul>

      {shown.length > limit && (
        <div className="text-center mt-3">
          <button onClick={() => setLimit((n) => n + PAGE)} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Show {Math.min(PAGE, shown.length - limit)} more
          </button>
        </div>
      )}
      {shown.length === 0 && (
        <div className={`${GLASS} rounded-xl p-8 text-center text-sm text-gray-400 dark:text-gray-500`}>
          Nothing matches these filters.
        </div>
      )}
    </div>
  );
}
