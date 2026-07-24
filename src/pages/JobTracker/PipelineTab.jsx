import React, { useState } from "react";
import { toast } from "react-toastify";
import { HiOutlineExternalLink, HiCheck, HiX, HiPlus } from "react-icons/hi";
import { GLASS_PANEL } from "../../components/glass";
import { APPLIED_SET, StatusSelect, daysSince, uid, normalizeUrl } from "./shared";

// ── Referral step constants ─────────────────────────────────────────────────
// Each referral opening progresses through: asked → appliedViaReferral → accepted/rejected
const REFERRAL_STEPS = [
  { key: "referralAt", label: "Asked" },
  { key: "referralAppliedAt", label: "Applied via Referral" },
  { key: "referralOutcomeAt", label: null },
];

function referralStepLabel(link) {
  if (link.referralOutcome === "accepted") return "Accepted";
  if (link.referralOutcome === "rejected") return "Rejected";
  if (link.referralAppliedAt) return "Applied via Referral";
  return "Asked for Referral";
}

function StepTimeline({ link }) {
  const steps = [];

  if (link.referralAt) {
    steps.push({ label: "Asked", ts: link.referralAt, active: true });
  }
  if (link.referralAppliedAt) {
    steps.push({ label: "Applied via Referral", ts: link.referralAppliedAt, active: true });
  }
  if (link.referralOutcome) {
    const label = link.referralOutcome === "accepted" ? "Accepted" : "Rejected";
    steps.push({ label, ts: link.referralOutcomeAt, active: true });
  }

  if (steps.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {steps.map((s, i) => {
        const d = daysSince(s.ts);
        const ago = d === 0 ? "today" : `${d}d ago`;
        const isLast = i === steps.length - 1;
        const isOutcome = s.label === "Accepted" || s.label === "Rejected";
        let cls = "text-violet-600 dark:text-violet-300";
        if (isOutcome) {
          cls = s.label === "Accepted"
            ? "text-emerald-600 dark:text-emerald-300"
            : "text-red-500 dark:text-red-400";
        }
        return (
          <React.Fragment key={s.label}>
            {i > 0 && <span className="text-gray-300 dark:text-gray-600 text-[10px]">→</span>}
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                isOutcome
                  ? s.label === "Accepted"
                    ? "bg-emerald-100 dark:bg-emerald-900/50"
                    : "bg-red-100 dark:bg-red-900/50"
                  : isLast
                  ? "bg-violet-100 dark:bg-violet-900/50"
                  : "bg-gray-100 dark:bg-slate-700"
              } ${cls}`}
            >
              {s.label} · {ago}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Toggle a single opening's state. Actions: "applied", "referral", "pending".
// Applied and referral are mutually exclusive. When an opening is marked
// applied and the company isn't already in an applied status, auto-bump it.
function makeToggle(entryOf, patchCompany) {
  return (companyId, linkId, action) => {
    const entry = entryOf(companyId);
    const links = (entry.links || []).map((l) => {
      if (l.id !== linkId) return l;
      if (action === "applied") return { ...l, applied: true, referral: false };
      if (action === "referral")
        return { ...l, applied: false, referral: true, referralAt: l.referralAt || Date.now() };
      return { ...l, applied: false, referral: false };
    });
    const patch = { links };
    if (action === "applied" && !APPLIED_SET.has(entry.status || "none")) patch.status = "applied";
    patchCompany(companyId, patch);
  };
}

function makeRemove(entryOf, patchCompany) {
  return (companyId, linkId) => {
    const entry = entryOf(companyId);
    const prevLinks = entry.links || [];
    const removed = prevLinks.find((l) => l.id === linkId);
    patchCompany(companyId, { links: prevLinks.filter((l) => l.id !== linkId) });
    toast.info(
      ({ closeToast }) => (
        <span className="text-sm">
          Removed <span className="font-semibold">{(removed?.label || "opening").slice(0, 40)}</span>{" "}
          <button
            onClick={() => { patchCompany(companyId, { links: prevLinks }); closeToast(); }}
            className="underline font-semibold text-indigo-600 dark:text-indigo-300"
          >
            Undo
          </button>
        </span>
      ),
      { autoClose: 4000 }
    );
  };
}

function makeAdvanceReferral(entryOf, patchCompany) {
  return (companyId, linkId, action) => {
    const entry = entryOf(companyId);
    const links = (entry.links || []).map((l) => {
      if (l.id !== linkId) return l;
      if (action === "appliedViaReferral") {
        return { ...l, referralAppliedAt: l.referralAppliedAt || Date.now() };
      }
      if (action === "accepted") {
        return { ...l, referralOutcome: "accepted", referralOutcomeAt: Date.now() };
      }
      if (action === "rejected") {
        return { ...l, referralOutcome: "rejected", referralOutcomeAt: Date.now() };
      }
      return l;
    });
    const patch = { links };
    if (action === "appliedViaReferral" && !APPLIED_SET.has(entry.status || "none")) {
      patch.status = "applied";
    }
    if (action === "accepted" && entry.status !== "offer") {
      patch.status = "offer";
    }
    patchCompany(companyId, patch);
  };
}

// ── Manual referral add form ────────────────────────────────────────────────
function ReferralAddForm({ allCompanies, patchCompany, entryOf, onClose }) {
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [url, setUrl] = useState("");

  const submit = () => {
    const company = allCompanies.find((c) => c.name.toLowerCase() === companyName.trim().toLowerCase());
    if (!company) {
      toast.warn("Company not found — add it via the Companies tab first");
      return;
    }
    const u = normalizeUrl(url);
    if (!u) {
      toast.warn("Paste the job opening URL");
      return;
    }
    const entry = entryOf(company.id);
    const newLink = {
      id: uid(),
      label: role.trim() || "Opening",
      url: u,
      applied: false,
      referral: true,
      referralAt: Date.now(),
    };
    const patch = { links: [...(entry.links || []), newLink] };
    if (!entry.status || entry.status === "none") patch.status = "toApply";
    patchCompany(company.id, patch);
    toast.success(`Referral added for ${company.name}`);
    setRole("");
    setUrl("");
  };

  const inputCls =
    "text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100";

  return (
    <div className={`${GLASS_PANEL} rounded-xl p-3 mb-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wide text-violet-600 dark:text-violet-300">
          Add referral opening
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500" title="Close">
          <HiX />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          list="referral-company-names"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company"
          className={`${inputCls} w-48`}
          autoFocus
        />
        <datalist id="referral-company-names">
          {allCompanies.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Role (e.g. SDE-2 Backend)"
          className={`${inputCls} w-44`}
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="https://… job opening link"
          className={`${inputCls} flex-1 min-w-[200px]`}
        />
        <button
          onClick={submit}
          className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white"
        >
          <HiPlus /> Add Referral
        </button>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
        Found an opening on a careers site and asked for a referral on LinkedIn? Add it here.
      </p>
    </div>
  );
}

// ── Opening row ─────────────────────────────────────────────────────────────
function OpeningRow({ link, onToggle, onRemove }) {
  const isReferral = !!link.referral;
  const isApplied = !!link.applied;

  return (
    <li className="flex items-center gap-2 text-sm rounded-lg px-1.5 py-1 hover:bg-indigo-50/70 dark:hover:bg-slate-700/50 transition-colors">
      <span className={`shrink-0 ${isApplied ? "text-emerald-500" : isReferral ? "text-violet-500" : "text-amber-500"}`}>
        {isApplied ? "✓" : isReferral ? "↗" : "○"}
      </span>
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer"
        className={`hover:underline truncate ${
          isApplied
            ? "text-emerald-600 dark:text-emerald-300"
            : isReferral
            ? "text-violet-600 dark:text-violet-300"
            : "text-indigo-600 dark:text-indigo-400"
        }`}
        title={link.url}
      >
        {link.label}
      </a>
      <HiOutlineExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
      <button
        onClick={onRemove}
        className="text-gray-400 hover:text-red-500 text-xs px-0.5 shrink-0"
        title="Remove from pipeline"
      >
        <HiX />
      </button>
      {isReferral && link.referralAt && !link.referralAppliedAt && !link.referralOutcome && (
        <span className="text-[11px] font-semibold text-violet-500 dark:text-violet-300 shrink-0">
          {daysSince(link.referralAt) === 0 ? "today" : `${daysSince(link.referralAt)}d ago`}
        </span>
      )}
      <div className="ml-auto flex gap-1.5 shrink-0">
        <button
          onClick={() => onToggle(isReferral ? "pending" : "referral")}
          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${
            isReferral
              ? "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-200 hover:bg-violet-200 dark:hover:bg-violet-900"
              : "border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30"
          }`}
          title={isReferral ? "Undo referral request" : "Ask for referral on LinkedIn"}
        >
          ↗ {isReferral ? "Referral" : "Referral?"}
        </button>
        <button
          onClick={() => onToggle(isApplied ? "pending" : "applied")}
          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${
            isApplied
              ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-900"
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          }`}
          title={isApplied ? "Mark as not applied" : "Mark this opening as applied"}
        >
          <HiCheck className="w-3.5 h-3.5" />
          {isApplied ? "Applied" : "Applied?"}
        </button>
      </div>
    </li>
  );
}

// ── Referral opening row (multi-step) ───────────────────────────────────────
function ReferralOpeningRow({ link, onToggle, onRemove, onAdvance }) {
  const hasAppliedViaReferral = !!link.referralAppliedAt;
  const outcome = link.referralOutcome;

  return (
    <li className="rounded-lg px-1.5 py-1.5 hover:bg-violet-50/70 dark:hover:bg-slate-700/50 transition-colors">
      <div className="flex items-center gap-2 text-sm">
        <span className="shrink-0 text-violet-500">↗</span>
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className={`hover:underline truncate ${
            outcome === "accepted"
              ? "text-emerald-600 dark:text-emerald-300"
              : outcome === "rejected"
              ? "text-red-500 dark:text-red-400 line-through"
              : "text-violet-600 dark:text-violet-300"
          }`}
          title={link.url}
        >
          {link.label}
        </a>
        <HiOutlineExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 text-xs px-0.5 shrink-0"
          title="Remove from pipeline"
        >
          <HiX />
        </button>
        <div className="ml-auto flex gap-1.5 shrink-0">
          {!outcome && !hasAppliedViaReferral && (
            <button
              onClick={() => onAdvance("appliedViaReferral")}
              className="text-[11px] font-bold px-2 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition-colors"
              title="Mark as applied through this referral"
            >
              Applied via Referral
            </button>
          )}
          {!outcome && hasAppliedViaReferral && (
            <>
              <button
                onClick={() => onAdvance("accepted")}
                className="text-[11px] font-bold px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                title="Referral application accepted"
              >
                Accepted
              </button>
              <button
                onClick={() => onAdvance("rejected")}
                className="text-[11px] font-bold px-2 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-sm transition-colors"
                title="Referral application rejected"
              >
                Rejected
              </button>
            </>
          )}
          {outcome && (
            <span
              className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
                outcome === "accepted"
                  ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200"
                  : "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300"
              }`}
            >
              {outcome === "accepted" ? "Accepted" : "Rejected"}
            </span>
          )}
        </div>
      </div>
      <StepTimeline link={link} />
    </li>
  );
}

function CompanyCard({ company, links, entry, toggleLink, removeLink, showStatus, patchCompany, badge, advanceReferral, isReferralSection }) {
  const status = entry.status || "none";
  let ring = "";
  if (showStatus) {
    if (status === "offer") ring = "ring-2 ring-emerald-400/50";
    else if (status === "interview") ring = "ring-2 ring-violet-400/40";
    else if (status === "oa") ring = "ring-2 ring-cyan-400/40";
  }

  return (
    <div className={`${GLASS_PANEL} rounded-xl p-4 hover:shadow-md transition-shadow ${ring}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800 dark:text-gray-100">{company.name}</span>
            {company.pay && (
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">₹{company.pay} LPA</span>
            )}
            {company.careers && (
              <a href={company.careers} target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400" title="Careers page">
                <HiOutlineExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          {company.location && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500">{company.location}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge}
          {showStatus && (
            <StatusSelect value={status} onChange={(v) => patchCompany(company.id, { status: v })} />
          )}
        </div>
      </div>
      {links.length > 0 ? (
        <ul className="space-y-0.5 mt-1">
          {links.map((l) =>
            isReferralSection ? (
              <ReferralOpeningRow
                key={l.id}
                link={l}
                onToggle={(action) => toggleLink(company.id, l.id, action)}
                onRemove={() => removeLink(company.id, l.id)}
                onAdvance={(action) => advanceReferral(company.id, l.id, action)}
              />
            ) : (
              <OpeningRow
                key={l.id}
                link={l}
                onToggle={(action) => toggleLink(company.id, l.id, action)}
                onRemove={() => removeLink(company.id, l.id)}
              />
            )
          )}
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
}

export default function PipelineTab({ allCompanies, entryOf, patchCompany }) {
  const toggleLink = makeToggle(entryOf, patchCompany);
  const removeLink = makeRemove(entryOf, patchCompany);
  const advanceReferral = makeAdvanceReferral(entryOf, patchCompany);
  const [addingReferral, setAddingReferral] = useState(false);

  const toApplyGroups = [];
  const referralGroups = [];
  const appliedGroups = [];

  allCompanies.forEach((c) => {
    const entry = entryOf(c.id);
    const links = entry.links || [];
    const status = entry.status || "none";

    const pending = links.filter((l) => !l.applied && !l.referral);
    const referral = links.filter((l) => l.referral);
    const applied = links.filter((l) => l.applied);

    if (pending.length > 0 || (status === "toApply" && links.length === 0)) {
      toApplyGroups.push({ company: c, links: pending, entry });
    }
    if (referral.length > 0) {
      referralGroups.push({ company: c, links: referral, entry });
    }
    if (applied.length > 0) {
      appliedGroups.push({ company: c, links: applied, entry });
    }
  });

  referralGroups.sort((a, b) => {
    const aMax = Math.max(...a.links.map((l) => l.referralAt || 0));
    const bMax = Math.max(...b.links.map((l) => l.referralAt || 0));
    return bMax - aMax;
  });

  const totalPending = toApplyGroups.reduce((s, g) => s + g.links.length, 0);
  const totalReferral = referralGroups.reduce((s, g) => s + g.links.length, 0);
  const totalApplied = appliedGroups.reduce((s, g) => s + g.links.length, 0);

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      {/* ── To Apply Queue ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-bold text-amber-600 dark:text-amber-300">To Apply</h2>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-200">
            {totalPending}
          </span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Pending openings — hit "Applied?" or "Referral?" on each opening.
        </p>
        <div className="space-y-3">
          {toApplyGroups.length === 0 && (
            <div className={`${GLASS_PANEL} rounded-xl p-8 text-center`}>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Nothing queued. Mark companies "To Apply" from the Companies tab, or track openings from Openings.
              </p>
            </div>
          )}
          {toApplyGroups.map((g) => {
            const allLinks = g.entry.links || [];
            const doneCount = allLinks.filter((l) => l.applied || l.referral).length;
            return (
              <CompanyCard
                key={g.company.id}
                company={g.company}
                links={g.links}
                entry={g.entry}
                toggleLink={toggleLink}
                removeLink={removeLink}
                patchCompany={patchCompany}
                badge={
                  allLinks.length > 0 && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        doneCount
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200"
                      }`}
                    >
                      {doneCount}/{allLinks.length} done
                    </span>
                  )
                }
              />
            );
          })}
        </div>
      </section>

      {/* ── Right column: Referral + Applied ───────────────────────────── */}
      <div className="space-y-6">
        {/* ── Asked for Referral ──────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-violet-600 dark:text-violet-300">Asked for Referral</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-200">
              {totalReferral}
            </span>
            <button
              onClick={() => setAddingReferral((s) => !s)}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white shadow-sm ml-auto"
            >
              <HiPlus className="w-3 h-3" /> Add
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Track referral progress: Asked → Applied via Referral → Accepted / Rejected.
          </p>

          {addingReferral && (
            <ReferralAddForm
              allCompanies={allCompanies}
              patchCompany={patchCompany}
              entryOf={entryOf}
              onClose={() => setAddingReferral(false)}
            />
          )}

          <div className="space-y-3">
            {referralGroups.length === 0 && !addingReferral && (
              <div className={`${GLASS_PANEL} rounded-xl p-8 text-center`}>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  No referrals requested yet — hit "Referral?" on openings or use the Add button above.
                </p>
              </div>
            )}
            {referralGroups.map((g) => (
              <CompanyCard
                key={g.company.id}
                company={g.company}
                links={g.links}
                entry={g.entry}
                toggleLink={toggleLink}
                removeLink={removeLink}
                patchCompany={patchCompany}
                advanceReferral={advanceReferral}
                isReferralSection
              />
            ))}
          </div>
        </section>

        {/* ── Applied ─────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-300">Applied</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200">
              {totalApplied}
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Track progress — Applied → OA → Interview → Offer. Update status as you advance.
          </p>
          <div className="space-y-3">
            {appliedGroups.length === 0 && (
              <div className={`${GLASS_PANEL} rounded-xl p-8 text-center`}>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  No applications yet — hit "Applied?" on an opening to start tracking.
                </p>
              </div>
            )}
            {appliedGroups.map((g) => {
              const appliedDays = daysSince(g.entry.appliedAt);
              return (
                <CompanyCard
                  key={g.company.id}
                  company={g.company}
                  links={g.links}
                  entry={g.entry}
                  toggleLink={toggleLink}
                  removeLink={removeLink}
                  showStatus
                  patchCompany={patchCompany}
                  badge={
                    appliedDays !== Infinity && (
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">
                        {appliedDays === 0 ? "today" : `${appliedDays}d ago`}
                      </span>
                    )
                  }
                />
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
