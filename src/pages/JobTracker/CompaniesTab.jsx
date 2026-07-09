import React, { useState, useMemo, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HiOutlineExternalLink,
  HiPlus,
  HiChevronDown,
  HiOutlineSearch,
} from "react-icons/hi";
import { GLASS } from "../../components/glass";
import {
  STATUSES,
  FIT_CLS,
  FIT_RANK,
  PAGE_SIZE,
  APPLIED_HIGHLIGHT_DAYS,
  CultureStars,
  StatusSelect,
  CompanyDetail,
  AddCompanyForm,
  isRecentlyApplied,
  daysSince,
} from "./shared";

// ── Company card (accordion) ─────────────────────────────────────────────────
const CompanyCard = memo(function CompanyCard({ company, entry, expanded, onToggle, onPatch, autoCovered }) {
  const status = entry.status || "none";
  const recentlyApplied = isRecentlyApplied(entry);
  const links = entry.links || [];
  const pending = links.filter((l) => !l.applied).length;

  let cardExtra = "";
  if (status === "skip") cardExtra = "opacity-45";
  else if (recentlyApplied) cardExtra = "ring-2 ring-blue-400/50";

  return (
    <div className={`${GLASS} rounded-xl overflow-hidden ${cardExtra}`}>
      {/* Header — clickable to expand */}
      <div
        onClick={onToggle}
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-indigo-50/60 dark:hover:bg-slate-700/40 transition-colors"
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
            {recentlyApplied && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-200"
                title={`Applied ${daysSince(entry.appliedAt)}d ago — highlight fades after ${APPLIED_HIGHLIGHT_DAYS}d`}
              >
                RECENT
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
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {company.tier && <span>{company.tier} · </span>}
            {company.pay ? `₹${company.pay} LPA` : "—"}
            {company.location ? ` · ${company.location}` : ""}
          </div>
          <div className="flex items-center gap-3 text-xs mt-1 flex-wrap">
            <span className="inline-flex items-center gap-0.5">
              <span className="text-gray-500 dark:text-gray-400">Culture:</span>{" "}
              <CultureStars n={company.culture} />
            </span>
            <span className={FIT_CLS[company.javaFit] || "text-gray-400 dark:text-gray-500"}>
              Java: {company.javaFit || "—"}
            </span>
            <span className={FIT_CLS[company.match] || "text-gray-400 dark:text-gray-500"}>
              Match: {company.match || "—"}
            </span>
            {links.length > 0 && (
              <span
                className={`font-bold px-1.5 py-0.5 rounded-full text-[10px] ${
                  pending
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200"
                }`}
                title={`${links.length} openings, ${pending} pending`}
              >
                {links.length - pending}/{links.length} applied
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
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

      {/* Company cards — 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
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
