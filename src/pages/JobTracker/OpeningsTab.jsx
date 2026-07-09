import React, { useState } from "react";
import { toast } from "react-toastify";
import { HiChevronDown, HiPlus, HiX } from "react-icons/hi";
import { GLASS, GLASS_PANEL } from "../../components/glass";
import { FIT_CLS, RADAR_NEW_DAYS, normalizeUrl } from "./shared";

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

  const newCutoff = Date.now() - RADAR_NEW_DAYS * 24 * 60 * 60 * 1000;
  const isNew = (o) => new Date(o.firstSeen).getTime() >= newCutoff;
  const active = radar.openings.filter((o) => !rejectedKeys[o.key]);
  const newCount = active.filter(isNew).length;
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
            📡 Discovered Openings ({active.length})
          </h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {newCount > 0 && (
              <span className="font-bold text-emerald-600 dark:text-emerald-300 mr-2">{newCount} new</span>
            )}
            {groups.length} companies · {watched} boards auto-watched · scanned{" "}
            {new Date(radar.summary.updatedAt).toLocaleString()}
          </span>
        </div>
        <button
          onClick={() => setAddingManual((s) => !s)}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
        >
          + Add opening manually
        </button>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
        "To Apply" saves the link under that company. Dismiss (×) crosses it out until it leaves the next scan.
      </p>

      {addingManual && (
        <div className={`${GLASS_PANEL} rounded-xl p-3 mb-3`}>
          <ManualOpeningForm allCompanies={allCompanies} onAdd={onManualAdd} onClose={() => setAddingManual(false)} />
        </div>
      )}

      {/* Two-column grid of company accordions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        {groups.map((cid) => {
          const c = companiesById[cid];
          const list = byCompany.get(cid);
          const liveCount = list.filter((o) => !rejectedKeys[o.key]).length;
          const hasNew = list.some((o) => isNew(o) && !rejectedKeys[o.key]);
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
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 shrink-0">
                  {liveCount}
                </span>
                {hasNew && (
                  <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200 shrink-0">
                    NEW
                  </span>
                )}
                <span className="ml-auto flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 shrink-0">
                  {c?.pay && <span>₹{c.pay} LPA</span>}
                  {c?.match && <span className={FIT_CLS[c.match] || ""}>{c.match}</span>}
                </span>
              </button>
              {open && (
                <ul className="px-3 pb-2.5 space-y-1.5">
                  {list.map((o) => {
                    const rejected = !!rejectedKeys[o.key];
                    return (
                      <li key={o.key} className="flex items-center gap-1.5 text-sm">
                        {isNew(o) && !rejected && (
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200 shrink-0">
                            NEW
                          </span>
                        )}
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
                        {/* Buttons right next to the title — no ml-auto gap */}
                        <span className="flex items-center gap-1 shrink-0">
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
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-[120px] shrink-0 hidden sm:inline" title={o.location}>
                          {o.location}
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

      {groups.length === 0 && (
        <div className={`${GLASS} rounded-xl p-10 text-center`}>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No unhandled openings — everything is tracked, dismissed, or the radar found no matches.
          </p>
        </div>
      )}
    </div>
  );
}
