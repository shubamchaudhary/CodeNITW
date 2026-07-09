import React, { useState } from "react";
import { toast } from "react-toastify";
import { HiChevronDown, HiPlus, HiX } from "react-icons/hi";
import { GLASS, GLASS_PANEL } from "../../components/glass";
import { FIT_CLS, RADAR_NEW_DAYS, normalizeUrl, ScoreBadge } from "./shared";

// ── Manual opening form ──────────────────────────────────────────────────────
function ManualOpeningForm({ allCompanies, onAdd, onClose }) {
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [url, setUrl] = useState("");

  const submit = () => {
    const company = allCompanies.find((c) => c.name.toLowerCase() === companyName.trim().toLowerCase());
    if (!company) {
      toast.warn("Company not found in your list — add it via the Companies tab first");
      return;
    }
    const u = normalizeUrl(url);
    if (!u) {
      toast.warn("Paste the job opening URL");
      return;
    }
    onAdd(company, role.trim() || "Opening", u);
    setRole("");
    setUrl("");
  };

  const inputCls =
    "text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100";
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <input
        list="radar-company-names"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="Company"
        className={`${inputCls} w-48`}
        autoFocus
      />
      <datalist id="radar-company-names">
        {allCompanies.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>
      <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. SDE-2 Backend)" className={`${inputCls} w-44`} />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="https://… job opening link"
        className={`${inputCls} flex-1 min-w-[200px]`}
      />
      <button
        onClick={submit}
        className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        <HiPlus /> To Apply
      </button>
      <button onClick={onClose} className="text-gray-400 hover:text-red-500" title="Close">
        <HiX />
      </button>
    </div>
  );
}

// ── Openings tab ─────────────────────────────────────────────────────────────
export default function OpeningsTab({
  radarVisible,
  companiesById,
  allCompanies,
  rejectedKeys,
  onTrack,
  onReject,
  onUnreject,
  onManualAdd,
}) {
  const [openIds, setOpenIds] = useState(() => new Set());
  const [addingManual, setAddingManual] = useState(false);
  const [onlyRemaining, setOnlyRemaining] = useState(false);
  const [sortMode, setSortMode] = useState("match");

  if (!radarVisible) {
    return (
      <div className={`${GLASS} rounded-xl p-12 text-center`}>
        <div className="text-2xl mb-2">📡</div>
        <p className="text-gray-400 dark:text-gray-500">Loading radar data…</p>
      </div>
    );
  }

  const radar = radarVisible;
  const groups = [];
  const byCompany = new Map();
  for (const o of radar.openings) {
    if (!byCompany.has(o.companyId)) {
      byCompany.set(o.companyId, []);
      groups.push(o.companyId);
    }
    byCompany.get(o.companyId).push(o);
  }

  const nameOf = (cid) => companiesById[cid]?.name || byCompany.get(cid)?.[0]?.company || "";
  const scoreOf = (o) => (typeof o.matchScore === "number" ? o.matchScore : -1);
  // Highest-match opening first within a company (unscored rows sink to the end).
  const byScore = (a, b) => scoreOf(b) - scoreOf(a) || (a.title || "").localeCompare(b.title || "");

  const newCutoff = Date.now() - RADAR_NEW_DAYS * 24 * 60 * 60 * 1000;
  const isNew = (o) => new Date(o.firstSeen).getTime() >= newCutoff;

  // Single source of truth per company: `visibleList` = untracked rows shown in
  // the list (sorted best-match first); `remaining` = untracked AND
  // not-dismissed (the actionable count on the badge); `topScore` = the best
  // actionable match, used to rank company groups. The header total is the SUM
  // of `remaining`, so it can never disagree with the badges.
  const meta = new Map();
  let totalRemaining = 0;
  let newCount = 0;
  for (const cid of groups) {
    const list = byCompany.get(cid);
    const visibleList = list.filter((o) => !o.tracked).sort(byScore);
    const remainingList = visibleList.filter((o) => !rejectedKeys[o.uKey]);
    const hasNew = remainingList.some(isNew);
    const topScore = remainingList.reduce((m, o) => Math.max(m, scoreOf(o)), -1);
    newCount += remainingList.filter(isNew).length;
    totalRemaining += remainingList.length;
    meta.set(cid, {
      list,
      visibleList,
      remaining: remainingList.length,
      queuedCount: list.length - visibleList.length,
      hasNew,
      topScore,
    });
  }

  // Rank company groups by best match (default) or by name. Best-match keeps the
  // most relevant companies at the top; name keeps positions perfectly stable.
  if (sortMode === "match") {
    groups.sort((a, b) => meta.get(b).topScore - meta.get(a).topScore || nameOf(a).localeCompare(nameOf(b)));
  } else {
    groups.sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
  }

  // Optional filter: only show companies that still have openings to apply to.
  const shownGroups = onlyRemaining ? groups.filter((cid) => meta.get(cid).remaining > 0) : groups;

  const watched = radar.summary.coveredCompanyIds?.length ?? radar.summary.boards;

  const toggle = (cid) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(cid) ? next.delete(cid) : next.add(cid);
      return next;
    });

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div>
          <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-300">
            📡 Discovered Openings ({totalRemaining})
          </h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {newCount > 0 && (
              <span className="font-bold text-emerald-600 dark:text-emerald-300 mr-2">{newCount} new</span>
            )}
            {shownGroups.length} companies · {watched} boards auto-watched · scanned{" "}
            {new Date(radar.summary.updatedAt).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 select-none">
            Sort
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="text-xs font-semibold px-2 py-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100 cursor-pointer"
              title="Best match ranks companies by their highest résumé-fit opening"
            >
              <option value="match">Best match</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </label>
          <label
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none"
            title="Hide companies whose openings are all queued or dismissed"
          >
            <input
              type="checkbox"
              checked={onlyRemaining}
              onChange={(e) => setOnlyRemaining(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 cursor-pointer"
            />
            Only with openings left
          </label>
          <button
            onClick={() => setAddingManual((s) => !s)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            + Add opening manually
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
        The <span className="font-semibold text-emerald-600 dark:text-emerald-300">fit</span> badge ranks each opening by how well its job description matches your skills (edit <span className="font-mono">radar/skills.json</span>). "To Apply" saves the link under that company; dismiss (×) crosses it out.
      </p>

      {addingManual && (
        <div className={`${GLASS_PANEL} rounded-xl p-3 mb-3`}>
          <ManualOpeningForm allCompanies={allCompanies} onAdd={onManualAdd} onClose={() => setAddingManual(false)} />
        </div>
      )}

      {/* Two-column grid of company accordions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        {shownGroups.map((cid) => {
          const c = companiesById[cid];
          const { list, visibleList, remaining: liveCount, queuedCount, hasNew, topScore } = meta.get(cid);
          const open = openIds.has(cid);
          return (
            <div key={cid} className={`${GLASS} rounded-xl overflow-hidden`}>
              <button
                onClick={() => toggle(cid)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-indigo-50/60 dark:hover:bg-slate-700/40 transition-colors"
              >
                <HiChevronDown className={`text-gray-400 transition-transform shrink-0 ${open ? "" : "-rotate-90"}`} />
                <span className="font-semibold text-gray-800 dark:text-gray-100">
                  {c?.name || list[0].company}
                </span>
                {topScore >= 0 && <ScoreBadge score={topScore} basis="skills" />}
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 shrink-0">
                  {liveCount}
                </span>
                {hasNew && (
                  <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200 shrink-0">
                    NEW
                  </span>
                )}
                {queuedCount > 0 && (
                  <span
                    className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shrink-0"
                    title={`${queuedCount} opening${queuedCount > 1 ? "s" : ""} already queued in To Apply`}
                  >
                    ✓{queuedCount} queued
                  </span>
                )}
                <span className="ml-auto flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 shrink-0">
                  {c?.pay && <span>₹{c.pay} LPA</span>}
                  {c?.match && <span className={FIT_CLS[c.match] || ""}>{c.match}</span>}
                </span>
              </button>
              {open && (
                <ul className="px-3 pb-2.5 space-y-0.5">
                  {visibleList.length === 0 && (
                    <li className="text-xs text-gray-400 dark:text-gray-500 italic px-2 py-1.5">
                      All openings queued in To Apply — nothing left to action here.
                    </li>
                  )}
                  {visibleList.map((o) => {
                    const rejected = !!rejectedKeys[o.uKey];
                    return (
                      <li
                        key={o.uKey}
                        className="flex items-center gap-1.5 text-sm rounded-lg px-2 py-1.5 hover:bg-indigo-50/70 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        {isNew(o) && !rejected && (
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200 shrink-0">
                            NEW
                          </span>
                        )}
                        {!rejected && <ScoreBadge score={o.matchScore} matched={o.matched} basis={o.matched?.length ? "skills" : o.desc ? "skills" : "title"} />}
                        <a
                          href={o.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`hover:underline truncate ${
                            rejected
                              ? "line-through text-gray-400 dark:text-gray-500"
                              : "text-indigo-600 dark:text-indigo-400"
                          }`}
                          title={`${o.title} — ${o.location}`}
                        >
                          {o.title}
                        </a>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-[120px] shrink-0 hidden sm:inline" title={o.location}>
                          {o.location}
                        </span>
                        {!rejected && o.matched?.length > 0 && (
                          <span className="hidden md:flex items-center gap-1 shrink-0">
                            {o.matched.slice(0, 3).map((m) => (
                              <span
                                key={m.skill}
                                className={`text-[9px] font-semibold px-1 py-0.5 rounded ${
                                  m.type === "want"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                                }`}
                                title={m.type === "want" ? "A skill you want to grow into" : "A skill you have"}
                              >
                                {m.skill}
                                {m.type === "want" ? " ↗" : ""}
                              </span>
                            ))}
                          </span>
                        )}
                        {/* Actions pushed to the far right of the row */}
                        <span className="ml-auto flex items-center gap-1 shrink-0">
                          {rejected ? (
                            <button
                              onClick={() => onUnreject(o)}
                              className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-500"
                              title="Restore this opening"
                            >
                              Undo
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => onTrack(o)}
                                className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                                title="Save under this company and queue in To Apply"
                              >
                                → To Apply
                              </button>
                              <button
                                onClick={() => onReject(o)}
                                className="text-gray-400 hover:text-red-500 text-xs px-0.5"
                                title="Dismiss"
                              >
                                <HiX />
                              </button>
                            </>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {shownGroups.length === 0 && (
        <div className={`${GLASS} rounded-xl p-10 text-center`}>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {onlyRemaining
              ? "No companies with openings left to apply — everything is queued or dismissed."
              : "No unhandled openings — everything is tracked, dismissed, or the radar found no matches."}
          </p>
        </div>
      )}
    </div>
  );
}
