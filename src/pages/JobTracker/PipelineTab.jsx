import React from "react";
import { HiOutlineExternalLink, HiCheck } from "react-icons/hi";
import { GLASS_PANEL } from "../../components/glass";
import { APPLIED_SET, StatusSelect, daysSince } from "./shared";

// Toggle a single opening's applied flag. When an opening is marked applied and
// the company is still in an un-applied state, bump it to "applied" so it starts
// showing in the Applied column (and records appliedAt via patchCompany).
function makeToggle(entryOf, patchCompany) {
  return (companyId, linkId, applied) => {
    const entry = entryOf(companyId);
    const links = (entry.links || []).map((l) => (l.id === linkId ? { ...l, applied } : l));
    const patch = { links };
    if (applied && !APPLIED_SET.has(entry.status || "none")) patch.status = "applied";
    patchCompany(companyId, patch);
  };
}

// One opening row with its own Applied button on the right.
function OpeningRow({ link, onToggle }) {
  return (
    <li className="flex items-center gap-2 text-sm rounded-lg px-1.5 py-1 hover:bg-indigo-50/70 dark:hover:bg-slate-700/50 transition-colors">
      <span className={`shrink-0 ${link.applied ? "text-emerald-500" : "text-amber-500"}`}>
        {link.applied ? "✓" : "○"}
      </span>
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer"
        className={`hover:underline truncate ${
          link.applied
            ? "text-emerald-600 dark:text-emerald-300"
            : "text-indigo-600 dark:text-indigo-400"
        }`}
        title={link.url}
      >
        {link.label}
      </a>
      <HiOutlineExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
      <button
        onClick={() => onToggle(!link.applied)}
        className={`ml-auto shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
          link.applied
            ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-900"
            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        }`}
        title={link.applied ? "Mark as not applied" : "Mark this opening as applied"}
      >
        <HiCheck className="w-3.5 h-3.5" />
        {link.applied ? "Applied" : "Applied?"}
      </button>
    </li>
  );
}

export default function PipelineTab({ toApplyList, appliedList, entryOf, patchCompany }) {
  const toggleLink = makeToggle(entryOf, patchCompany);

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      {/* ── To Apply Queue ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-bold text-amber-600 dark:text-amber-300">
            To Apply
          </h2>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-200">
            {toApplyList.length}
          </span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Companies with pending openings — hit "Applied?" on each opening as you apply.
        </p>
        <div className="space-y-3">
          {toApplyList.length === 0 && (
            <div className={`${GLASS_PANEL} rounded-xl p-8 text-center`}>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Nothing queued. Mark companies "To Apply" from the Companies tab, or track openings from Openings.
              </p>
            </div>
          )}
          {toApplyList.map((c) => {
            const entry = entryOf(c.id);
            const links = entry.links || [];
            const pending = links.filter((l) => !l.applied).length;
            return (
              <div key={c.id} className={`${GLASS_PANEL} rounded-xl p-4 hover:shadow-md transition-shadow`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{c.name}</span>
                      {c.pay && (
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          ₹{c.pay} LPA
                        </span>
                      )}
                      {c.careers && (
                        <a
                          href={c.careers}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400"
                          title="Careers page"
                        >
                          <HiOutlineExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    {c.location && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">{c.location}</p>
                    )}
                  </div>
                  {links.length > 0 && (
                    <span
                      className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        pending
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200"
                      }`}
                    >
                      {links.length - pending}/{links.length} applied
                    </span>
                  )}
                </div>
                {links.length > 0 ? (
                  <ul className="space-y-0.5 mt-1">
                    {links.map((l) => (
                      <OpeningRow key={l.id} link={l} onToggle={(v) => toggleLink(c.id, l.id, v)} />
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                    Marked "To Apply" — add openings from the Companies tab.
                  </p>
                )}
                {entry.note && (
                  <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 truncate">{entry.note}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Applied Companies ──────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-300">
            Applied
          </h2>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200">
            {appliedList.length}
          </span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Track progress — Applied → OA → Interview → Offer. Update status as you advance.
        </p>
        <div className="space-y-3">
          {appliedList.length === 0 && (
            <div className={`${GLASS_PANEL} rounded-xl p-8 text-center`}>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                No applications yet — hit "Applied?" on an opening in the To Apply queue to start tracking.
              </p>
            </div>
          )}
          {appliedList.map((c) => {
            const entry = entryOf(c.id);
            const links = entry.links || [];
            const status = entry.status || "none";
            const appliedDays = daysSince(entry.appliedAt);

            let statusBg = "";
            if (status === "offer") statusBg = "ring-2 ring-emerald-400/50";
            else if (status === "interview") statusBg = "ring-2 ring-violet-400/40";
            else if (status === "oa") statusBg = "ring-2 ring-cyan-400/40";

            return (
              <div key={c.id} className={`${GLASS_PANEL} rounded-xl p-4 hover:shadow-md transition-shadow ${statusBg}`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{c.name}</span>
                      {c.pay && (
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          ₹{c.pay} LPA
                        </span>
                      )}
                      {c.careers && (
                        <a
                          href={c.careers}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400"
                          title="Careers page"
                        >
                          <HiOutlineExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    {appliedDays !== Infinity && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        Applied {appliedDays === 0 ? "today" : `${appliedDays}d ago`}
                        {c.location ? ` · ${c.location}` : ""}
                      </p>
                    )}
                  </div>
                  <StatusSelect value={status} onChange={(v) => patchCompany(c.id, { status: v })} />
                </div>
                {links.length > 0 && (
                  <ul className="space-y-0.5 mt-1">
                    {links.map((l) => (
                      <OpeningRow key={l.id} link={l} onToggle={(v) => toggleLink(c.id, l.id, v)} />
                    ))}
                  </ul>
                )}
                {entry.note && (
                  <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 truncate">{entry.note}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
