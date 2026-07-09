import React, { useState, useMemo, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HiOutlineExternalLink,
  HiPlus,
  HiChevronDown,
  HiOutlineSearch,
  HiCheck,
} from "react-icons/hi";
import { GLASS } from "../../components/glass";
import {
  FIT_CLS,
  FIT_RANK,
  PAGE_SIZE,
  APPLIED_HIGHLIGHT_DAYS,
  StatusSelect,
  CompanyDetail,
  AddCompanyForm,
  daysSince,
} from "./shared";

// ── Company card (accordion) ─────────────────────────────────────────────────
const CompanyCard = memo(function CompanyCard({ company, entry, expanded, onToggle, onPatch, autoCovered }) {
  const status = entry.status || "none";
  const links = entry.links || [];
  const pending = links.filter((l) => !l.applied).length;

  // Direct-apply model for the Companies tab: one click marks the company as
  // applied (stamps appliedAt = now). The "applied" look only holds for
  // APPLIED_HIGHLIGHT_DAYS days; after that it reverts to "Not Applied" as a
  // nudge to re-apply, while still showing when it was last applied.
  const appliedAt = entry.appliedAt;
  const appliedDays = daysSince(appliedAt);
  const hasApplied = appliedAt != null && appliedDays !== Infinity;
  const activeApplied = hasApplied && appliedDays <= APPLIED_HIGHLIGHT_DAYS;

  const agoLabel = hasApplied
    ? appliedDays === 0
      ? "applied today"
      : `applied ${appliedDays}d ago`
    : null;

  const toggleApplied = (e) => {
    e.stopPropagation();
    if (activeApplied) onPatch({ status: "none" });
    else onPatch({ status: "applied", appliedAt: Date.now() });
  };

  let cardExtra = "";
  if (status === "skip") cardExtra = "opacity-45";
  else if (activeApplied) cardExtra = "ring-2 ring-emerald-400/50";

  return (
    <div className={`${GLASS} rounded-xl overflow-hidden ${cardExtra}`}>
      {/* Header — clickable to expand */}
      <div
        onClick={onToggle}
        className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-indigo-50/60 dark:hover:bg-slate-700/40 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-[15px]">{company.name}</span>
            {company.customEntry && (
              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300">
                MINE
              </span>
            )}
            {autoCovered && (
              <span
                className="text-[9px] font-bold px-1 py-0.5 rounded bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300"
                title="Job board watched automatically"
              >
                📡 AUTO
              </span>
            )}
            {company.careers && (
              <a
                href={company.careers}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                title="Careers page"
              >
                <HiOutlineExternalLink />
              </a>
            )}
            {links.length > 0 && (
              <span
                className={`font-bold px-1.5 py-0.5 rounded-full text-[10px] ${
                  pending
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200"
                }`}
                title={`${links.length} openings, ${pending} pending`}
              >
                {links.length - pending}/{links.length}
              </span>
            )}
          </div>
          {/* One compact meta line */}
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
            {company.tier && <span>{company.tier} · </span>}
            {company.pay ? `₹${company.pay} LPA` : "—"}
            {company.location ? ` · ${company.location}` : ""}
            <span className="mx-1 text-gray-300 dark:text-gray-600">|</span>
            <span className="text-amber-500 dark:text-amber-400">★{company.culture || "—"}</span>
            <span className="mx-1 text-gray-300 dark:text-gray-600">·</span>
            <span className={FIT_CLS[company.javaFit] || ""}>Java {company.javaFit || "—"}</span>
            <span className="mx-1 text-gray-300 dark:text-gray-600">·</span>
            <span className={FIT_CLS[company.match] || ""}>Match {company.match || "—"}</span>
          </div>
        </div>

        {/* Right: quick Applied toggle + full status + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-end gap-0.5">
            <button
              onClick={toggleApplied}
              className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                activeApplied
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600"
              }`}
              title={activeApplied ? "Click to un-mark applied" : "Mark this company as applied"}
            >
              {activeApplied ? (
                <>
                  <HiCheck className="w-3.5 h-3.5" /> Applied
                </>
              ) : (
                "Not Applied"
              )}
            </button>
            {agoLabel && (
              <span
                className={`text-[10px] ${
                  activeApplied ? "text-emerald-600 dark:text-emerald-300" : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {agoLabel}
              </span>
            )}
          </div>
          <StatusSelect value={status} onChange={(v) => onPatch({ status: v })} />
          <HiChevronDown className={`text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </div>
      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-200/60 dark:border-slate-700/60 bg-gray-50/60 dark:bg-slate-800/40">
          <CompanyDetail company={company} entry={entry} onPatch={onPatch} />
        </div>
      )}
    </div>
  );
});

// ── Companies tab ────────────────────────────────────────────────────────────
export default function CompaniesTab({ allCompanies, companies, patchCompany, addCustom, radarCoveredIds, entryOf }) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fitFilter, setFitFilter] = useState("all");
  const [sortBy, setSortBy] = useState("composite");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [expandedId, setExpandedId] = useState(null);
  const [adding, setAdding] = useState(false);

  const tiers = useMemo(
    () => [...new Set(allCompanies.map((c) => c.tier).filter(Boolean))].sort(),
    [allCompanies]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = allCompanies.filter((c) => {
      const e = companies[c.id] || {};
      const status = e.status || "none";
      if (q && !`${c.name} ${c.category} ${c.location} ${c.tier}`.toLowerCase().includes(q)) return false;
      if (tierFilter !== "all" && c.tier !== tierFilter) return false;
      if (statusFilter !== "all") {
        if (statusFilter === "inProcess") {
          if (!["oa", "interview"].includes(status)) return false;
        } else if (status !== statusFilter) return false;
      }
      if (fitFilter !== "all" && c.javaFit !== fitFilter && c.match !== fitFilter) return false;
      return true;
    });
    const payMax = (c) => {
      const m = String(c.pay).match(/(\d+)(?!.*\d)/);
      return m ? Number(m[1]) : 0;
    };
    const fitRank = (v) => FIT_RANK[v] || 0;

    if (sortBy === "composite") {
      list.sort((a, b) => {
        const matchDiff = fitRank(b.match) - fitRank(a.match);
        if (matchDiff !== 0) return matchDiff;
        const fitDiff = fitRank(b.javaFit) - fitRank(a.javaFit);
        if (fitDiff !== 0) return fitDiff;
        const cultureDiff = (b.culture || 0) - (a.culture || 0);
        if (cultureDiff !== 0) return cultureDiff;
        return payMax(b) - payMax(a);
      });
    } else if (sortBy === "score") {
      list.sort((a, b) => b.score - a.score);
    } else if (sortBy === "culture") {
      list.sort((a, b) => (b.culture || 0) - (a.culture || 0) || b.score - a.score);
    } else if (sortBy === "pay") {
      list.sort((a, b) => payMax(b) - payMax(a));
    } else if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [allCompanies, companies, search, tierFilter, statusFilter, fitFilter, sortBy]);

  const visible = filtered.slice(0, limit);

  const selectCls =
    "text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100 cursor-pointer";

  return (
    <div>
      {/* Add Company button */}
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setAdding((a) => !a)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
        >
          <HiPlus /> Add company
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <AddCompanyForm onAdd={addCustom} onClose={() => setAdding(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className={`${GLASS} rounded-xl p-3 mb-4 flex flex-wrap items-center gap-2`}>
        <div className="relative flex-1 min-w-[200px]">
          <HiOutlineSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setLimit(PAGE_SIZE);
            }}
            placeholder="Search company, category, location…"
            className="w-full text-sm pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100"
          />
        </div>
        <select value={tierFilter} onChange={(e) => { setTierFilter(e.target.value); setLimit(PAGE_SIZE); }} className={selectCls}>
          <option value="all">All tiers</option>
          {tiers.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setLimit(PAGE_SIZE); }} className={selectCls}>
          <option value="all">All statuses</option>
          <option value="none">Not Started</option>
          <option value="toApply">To Apply</option>
          <option value="applied">Applied</option>
          <option value="inProcess">OA / Interview</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
          <option value="skip">Skipped</option>
        </select>
        <select value={fitFilter} onChange={(e) => { setFitFilter(e.target.value); setLimit(PAGE_SIZE); }} className={selectCls}>
          <option value="all">Any fit</option>
          <option value="Very High">Very High fit</option>
          <option value="High">High fit</option>
          <option value="Medium">Medium fit</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectCls}>
          <option value="composite">Sort: Best Fit</option>
          <option value="score">Sort: Priority</option>
          <option value="pay">Sort: Pay</option>
          <option value="culture">Sort: Culture</option>
          <option value="name">Sort: Name</option>
        </select>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
          {filtered.length} shown
        </span>
      </div>

      {/* Company cards — one per row */}
      <div className="space-y-3">
        {visible.map((c) => (
          <CompanyCard
            key={c.id}
            company={c}
            entry={entryOf(c.id)}
            expanded={expandedId === c.id}
            onToggle={() => setExpandedId((e) => (e === c.id ? null : c.id))}
            onPatch={(patch) => patchCompany(c.id, patch)}
            autoCovered={radarCoveredIds.has(c.id)}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <div className={`${GLASS} rounded-xl p-10 text-center`}>
          <p className="text-sm text-gray-400 dark:text-gray-500">No companies match these filters.</p>
        </div>
      )}

      {filtered.length > limit && (
        <button
          onClick={() => setLimit((l) => l + PAGE_SIZE)}
          className={`w-full mt-3 py-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-slate-700/60 ${GLASS} rounded-xl`}
        >
          Show {Math.min(PAGE_SIZE, filtered.length - limit)} more ({filtered.length - limit} remaining)
        </button>
      )}
    </div>
  );
}
