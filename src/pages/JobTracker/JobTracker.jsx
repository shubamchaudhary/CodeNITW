import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineExternalLink,
  HiPlus,
  HiTrash,
  HiChevronDown,
  HiOutlineClipboardCopy,
  HiOutlineSearch,
  HiStar,
  HiX,
  HiPhone,
  HiMail,
} from "react-icons/hi";
import { GLASS, GLASS_PANEL } from "../../components/glass";
import { KEYS, loadJSON, saveJSON, subscribe } from "../../Data/planStore";
import {
  COMPANIES,
  REFERRAL_TEMPLATES,
} from "../../Data/jobTrackerCompanies";

const STATUSES = {
  none: { label: "Not Started", cls: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300" },
  toApply: { label: "To Apply", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200" },
  applied: { label: "Applied", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200" },
  oa: { label: "OA / Test", cls: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-200" },
  interview: { label: "Interview", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200" },
  offer: { label: "Offer", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-200" },
  skip: { label: "Skipped", cls: "bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-gray-500" },
};

const APPLIED_SET = new Set(["applied", "oa", "interview", "offer", "rejected"]);

const FIT_CLS = {
  "Very High": "text-emerald-600 dark:text-emerald-300 font-bold",
  High: "text-green-600 dark:text-green-300 font-semibold",
  Medium: "text-amber-600 dark:text-amber-300",
  Low: "text-gray-400 dark:text-gray-500",
};

const FIT_RANK = { "Very High": 4, High: 3, Medium: 2, Low: 1 };

const APPLIED_HIGHLIGHT_DAYS = 10;

const PAGE_SIZE = 60;

// Daily-radar output committed by .github/workflows/job-radar.yml. Fetched at
// runtime so new openings appear without a redeploy; main is tried first, the
// feature branch is the fallback until the PR merges.
const RADAR_SOURCES = [
  "https://raw.githubusercontent.com/shubamchaudhary/CodeNITW/main/radar/openings.json",
  "https://raw.githubusercontent.com/shubamchaudhary/CodeNITW/claude/job-application-tracker-nqpn76/radar/openings.json",
];
const RADAR_NEW_DAYS = 3;

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadState() {
  const s = loadJSON(KEYS.JOB_TRACKER, {});
  return { companies: s.companies || {}, custom: s.custom || [], dismissedOpenings: s.dismissedOpenings || {} };
}

function normUrl(url) {
  return (url || "").replace(/^https?:\/\//, "").replace(/[?#].*$/, "").replace(/\/$/, "").toLowerCase();
}

function normalizeUrl(url) {
  const u = url.trim();
  if (!u) return "";
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

function copyText(text, msg) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(msg || "Copied!"))
    .catch(() => toast.error("Copy failed"));
}

function daysSince(timestamp) {
  if (!timestamp) return Infinity;
  return Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
}

function isRecentlyApplied(entry) {
  if (!entry.appliedAt) return false;
  const status = entry.status || "none";
  if (!APPLIED_SET.has(status)) return false;
  return daysSince(entry.appliedAt) <= APPLIED_HIGHLIGHT_DAYS;
}

// ── Small building blocks ────────────────────────────────────────────────────
function CultureStars({ n }) {
  if (!n) return <span className="text-gray-400 dark:text-gray-500">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500 dark:text-amber-400" title={`Culture ${n}/5`}>
      {n}
      <HiStar className="inline" />
    </span>
  );
}

function StatusSelect({ value, onChange }) {
  const v = value || "none";
  return (
    <select
      value={v}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value)}
      className={`text-xs font-semibold rounded-lg px-2 py-1.5 border-0 cursor-pointer focus:ring-2 focus:ring-indigo-400 ${STATUSES[v].cls}`}
    >
      {Object.entries(STATUSES).map(([k, s]) => (
        <option key={k} value={k}>
          {s.label}
        </option>
      ))}
    </select>
  );
}

// ── HR Contacts manager ──────────────────────────────────────────────────────
function HRContactsEditor({ contacts, onChange }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const add = () => {
    if (!name.trim() && !phone.trim() && !email.trim()) {
      toast.warn("Enter at least a name, phone or email");
      return;
    }
    onChange([
      ...contacts,
      { id: uid(), name: name.trim(), phone: phone.trim(), email: email.trim() },
    ]);
    setName("");
    setPhone("");
    setEmail("");
  };

  const inputCls =
    "text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100";

  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
        HR / Recruiter Contacts
      </div>
      {contacts.length === 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          No contacts added yet — add recruiters, HRs, or referrers below.
        </p>
      )}
      <ul className="space-y-1.5 mb-3">
        {contacts.map((c) => (
          <li key={c.id} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
            <span className="font-medium">{c.name || "—"}</span>
            {c.phone && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <HiPhone className="text-emerald-500" />
                <a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a>
              </span>
            )}
            {c.email && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <HiMail className="text-blue-500" />
                <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a>
              </span>
            )}
            <button
              onClick={() => onChange(contacts.filter((x) => x.id !== c.id))}
              className="text-gray-400 hover:text-red-500 shrink-0 ml-auto"
              title="Remove contact"
            >
              <HiTrash />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name / role (e.g. HR, Recruiter)"
          className={`${inputCls} w-44`}
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          className={`${inputCls} w-40`}
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Email"
          className={`${inputCls} flex-1 min-w-[180px]`}
        />
        <button
          onClick={add}
          className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <HiPlus /> Add
        </button>
      </div>
    </div>
  );
}

// ── Apply-links manager ──────────────────────────────────────────────────────
function LinksEditor({ links, onChange }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  const add = () => {
    const u = normalizeUrl(url);
    if (!u) {
      toast.warn("Paste the job opening URL first");
      return;
    }
    onChange([...links, { id: uid(), label: label.trim() || "Opening", url: u, applied: false }]);
    setLabel("");
    setUrl("");
  };

  const inputCls =
    "text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100";

  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
        Openings / Apply Links
      </div>
      {links.length === 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          No openings added yet — paste job links below as you find them.
        </p>
      )}
      <ul className="space-y-1.5 mb-3">
        {links.map((l) => (
          <li key={l.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!l.applied}
              onChange={(e) =>
                onChange(links.map((x) => (x.id === l.id ? { ...x, applied: e.target.checked } : x)))
              }
              title={l.applied ? "Applied" : "Mark as applied"}
              className="w-4 h-4 accent-emerald-500 cursor-pointer shrink-0"
            />
            <a
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className={`truncate max-w-[380px] hover:underline ${
                l.applied
                  ? "text-emerald-600 dark:text-emerald-300"
                  : "text-indigo-600 dark:text-indigo-400"
              }`}
              title={l.url}
            >
              {l.label} <HiOutlineExternalLink className="inline mb-0.5" />
            </a>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                l.applied
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200"
              }`}
            >
              {l.applied ? "APPLIED" : "PENDING"}
            </span>
            <button
              onClick={() => onChange(links.filter((x) => x.id !== l.id))}
              className="text-gray-400 hover:text-red-500 shrink-0"
              title="Remove link"
            >
              <HiTrash />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Role (e.g. SDE-2 Backend)"
          className={`${inputCls} w-44`}
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="https://… job opening link"
          className={`${inputCls} flex-1 min-w-[200px]`}
        />
        <button
          onClick={add}
          className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <HiPlus /> Add
        </button>
      </div>
    </div>
  );
}

function NoteEditor({ note, onSave }) {
  const [draft, setDraft] = useState(note || "");
  useEffect(() => setDraft(note || ""), [note]);
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
        Notes (JR IDs, referrer, next step…)
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft !== (note || "") && onSave(draft)}
        rows={3}
        placeholder="e.g. JR-12345 · referred by X · OA on 15th"
        className="w-full text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100 resize-y"
      />
    </div>
  );
}

// ── Expanded row detail ──────────────────────────────────────────────────────
function CompanyDetail({ company, entry, onPatch }) {
  const template = REFERRAL_TEMPLATES[company.template];
  const [showTemplate, setShowTemplate] = useState(false);

  return (
    <div className={`${GLASS_PANEL} rounded-xl p-5 space-y-5`}>
      <LinksEditor links={entry.links || []} onChange={(links) => onPatch({ links })} />
      <HRContactsEditor contacts={entry.hrContacts || []} onChange={(hrContacts) => onPatch({ hrContacts })} />
      <NoteEditor note={entry.note} onSave={(note) => onPatch({ note })} />

      {template && (
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowTemplate((s) => !s)}
              className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {showTemplate ? "Hide" : "Show"} referral template ({company.template})
            </button>
            <button
              onClick={() => copyText(template.message, "Referral message copied")}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
            >
              <HiOutlineClipboardCopy /> Copy message
            </button>
          </div>
          {showTemplate && (
            <pre className="mt-2 text-xs whitespace-pre-wrap text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-600">
              {template.message}
            </pre>
          )}
        </div>
      )}

      {company.notes && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-semibold">Intel:</span> {company.notes}
        </p>
      )}
    </div>
  );
}

// ── One table row ────────────────────────────────────────────────────────────
const CompanyRow = memo(function CompanyRow({ company, entry, expanded, onToggle, onPatch, autoCovered }) {
  const links = entry.links || [];
  const pending = links.filter((l) => !l.applied).length;
  const status = entry.status || "none";
  const recentlyApplied = isRecentlyApplied(entry);

  let rowBg = "";
  if (status === "skip") {
    rowBg = "opacity-45";
  } else if (recentlyApplied) {
    rowBg = "bg-blue-50/70 dark:bg-blue-900/20";
  }

  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer border-b border-gray-200/60 dark:border-slate-700/60 hover:bg-indigo-50/60 dark:hover:bg-slate-700/40 transition-colors ${rowBg}`}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-[15px]">{company.name}</span>
            {company.customEntry && (
              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300">
                MINE
              </span>
            )}
            {autoCovered && (
              <span
                className="text-[9px] font-bold px-1 py-0.5 rounded bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300"
                title="Job board watched automatically — new relevant openings land in Discovered Openings daily, no need to check this careers page manually"
              >
                📡 AUTO
              </span>
            )}
            {recentlyApplied && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-200" title={`Applied ${daysSince(entry.appliedAt)}d ago — highlight fades after ${APPLIED_HIGHLIGHT_DAYS}d`}>
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
          <div className="text-xs text-gray-400 dark:text-gray-500 lg:hidden mt-0.5">
            {company.pay && `₹${company.pay} LPA · `}
            {company.location}
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-700 dark:text-gray-200 hidden sm:table-cell text-[15px]">
          {company.pay ? `₹${company.pay}` : "—"}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">{company.tier}</td>
        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden xl:table-cell">{company.category}</td>
        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell max-w-[180px] truncate" title={company.location}>
          {company.location}
        </td>
        <td className="px-4 py-3 text-sm hidden md:table-cell">
          <CultureStars n={company.culture} />
        </td>
        <td className={`px-4 py-3 text-sm hidden md:table-cell ${FIT_CLS[company.javaFit] || "text-gray-400 dark:text-gray-500"}`}>
          {company.javaFit || "—"}
        </td>
        <td className={`px-4 py-3 text-sm hidden md:table-cell ${FIT_CLS[company.match] || "text-gray-400 dark:text-gray-500"}`}>
          {company.match || "—"}
        </td>
        <td className="px-4 py-3">
          <StatusSelect value={status} onChange={(v) => onPatch({ status: v })} />
        </td>
        <td className="px-4 py-3 text-center">
          {links.length > 0 ? (
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                pending
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200"
              }`}
              title={`${links.length} openings, ${pending} pending`}
            >
              {links.length - pending}/{links.length}
            </span>
          ) : (
            <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
          )}
        </td>
        <td className="px-2 py-3 text-gray-400 dark:text-gray-500">
          <HiChevronDown className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-gray-200/60 dark:border-slate-700/60">
          <td colSpan={11} className="px-4 pb-4 pt-2 bg-gray-50/60 dark:bg-slate-800/40">
            <CompanyDetail company={company} entry={entry} onPatch={onPatch} />
          </td>
        </tr>
      )}
    </>
  );
});

// ── Add-your-own-company form ────────────────────────────────────────────────
function AddCompanyForm({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: "", pay: "", location: "", careers: "", category: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    if (!form.name.trim()) {
      toast.warn("Company name is required");
      return;
    }
    onAdd({
      id: `custom-${uid()}`,
      name: form.name.trim(),
      tier: "Custom",
      category: form.category.trim(),
      location: form.location.trim(),
      remote: "",
      culture: null,
      pay: form.pay.trim(),
      javaFit: "",
      match: "",
      template: "",
      careers: normalizeUrl(form.careers),
      notes: "",
      ncr: false,
      score: 0,
      customEntry: true,
    });
    onClose();
  };

  const inputCls =
    "text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100";
  return (
    <div className={`${GLASS} rounded-xl p-4 mb-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base">Add a company</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500">
          <HiX />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={form.name} onChange={set("name")} placeholder="Company name *" className={`${inputCls} w-48`} autoFocus />
        <input value={form.pay} onChange={set("pay")} placeholder="Pay band (e.g. 40-55)" className={`${inputCls} w-40`} />
        <input value={form.location} onChange={set("location")} placeholder="Location(s)" className={`${inputCls} w-40`} />
        <input value={form.category} onChange={set("category")} placeholder="Category" className={`${inputCls} w-40`} />
        <input value={form.careers} onChange={set("careers")} placeholder="Careers page URL" className={`${inputCls} flex-1 min-w-[180px]`} />
        <button
          onClick={submit}
          className="inline-flex items-center gap-1 text-sm font-semibold px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <HiPlus /> Add company
        </button>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        Use this for any company not in the list — it gets the same status + apply-links tracking.
      </p>
    </div>
  );
}

// ── Bottom summary sections ──────────────────────────────────────────────────
function SummaryCompany({ company, entry, onJump }) {
  const links = entry.links || [];
  return (
    <div className={`${GLASS_PANEL} rounded-xl p-3`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={onJump}
          className="font-semibold text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 text-left"
        >
          {company.name}
        </button>
        <div className="flex items-center gap-2">
          {company.pay && (
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">₹{company.pay} LPA</span>
          )}
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUSES[entry.status || "none"].cls}`}>
            {STATUSES[entry.status || "none"].label}
          </span>
        </div>
      </div>
      {links.length > 0 && (
        <ul className="mt-1.5 space-y-0.5">
          {links.map((l) => (
            <li key={l.id} className="text-xs flex items-center gap-1.5">
              <span className={l.applied ? "text-emerald-500" : "text-amber-500"}>{l.applied ? "✓" : "○"}</span>
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-[300px]"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      {entry.note && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 truncate">{entry.note}</p>}
    </div>
  );
}

// ── Radar bucket: openings discovered by the daily CI radar ─────────────────
// Compact accordion: one row per company (name + openings count), expand to
// see openings. "To Apply" tracks the link on that company; "Reject" (with a
// confirm) crosses the opening out — it stays visible, struck through, until
// it stops appearing in the radar feed.
function ManualOpeningForm({ allCompanies, onAdd, onClose }) {
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [url, setUrl] = useState("");

  const submit = () => {
    const company = allCompanies.find((c) => c.name.toLowerCase() === companyName.trim().toLowerCase());
    if (!company) {
      toast.warn("Company not found in your list — add it via 'Add company' first");
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

function RadarBucket({ radar, companiesById, allCompanies, rejectedKeys, onTrack, onReject, onUnreject, onManualAdd }) {
  const [openIds, setOpenIds] = useState(() => new Set());
  const [addingManual, setAddingManual] = useState(false);
  if (!radar) return null;

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
    <div className={`${GLASS} rounded-xl p-4 mb-5`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-300">
          📡 Discovered Openings ({active.length})
        </h2>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {newCount > 0 && (
            <span className="font-bold text-emerald-600 dark:text-emerald-300 mr-2">{newCount} new</span>
          )}
          {groups.length} companies with matches · {watched} boards auto-watched · scanned{" "}
          {new Date(radar.summary.updatedAt).toLocaleString()}
        </span>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          "To Apply" saves the link under that company. Reject crosses an opening out — it disappears for
          good once it leaves the next scan.
        </p>
        <button
          onClick={() => setAddingManual((s) => !s)}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
        >
          + Add opening manually
        </button>
      </div>
      {addingManual && (
        <div className={`${GLASS_PANEL} rounded-xl p-3 mb-3`}>
          <ManualOpeningForm allCompanies={allCompanies} onAdd={onManualAdd} onClose={() => setAddingManual(false)} />
        </div>
      )}

      <div className="divide-y divide-gray-200/60 dark:divide-slate-700/60 rounded-xl overflow-hidden border border-gray-200/60 dark:border-slate-700/60">
        {groups.map((cid) => {
          const c = companiesById[cid];
          const list = byCompany.get(cid);
          const liveCount = list.filter((o) => !rejectedKeys[o.key]).length;
          const hasNew = list.some((o) => isNew(o) && !rejectedKeys[o.key]);
          const open = openIds.has(cid);
          return (
            <div key={cid} className="bg-white/40 dark:bg-slate-800/40">
              <button
                onClick={() => toggle(cid)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-indigo-50/60 dark:hover:bg-slate-700/40"
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
                <ul className="px-4 pb-2 space-y-1">
                  {list.map((o) => {
                    const rejected = !!rejectedKeys[o.key];
                    return (
                      <li key={o.key} className="flex items-center gap-2 text-sm">
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
                        <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[160px] shrink-0" title={o.location}>
                          {o.location}
                        </span>
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
                                title="Save under this company and queue it in To Apply"
                              >
                                → To Apply
                              </button>
                              <button
                                onClick={() => onReject(o)}
                                className="text-gray-400 hover:text-red-500 text-xs px-1"
                                title="Reject this opening"
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
      {groups.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
          No unhandled openings right now — everything is tracked, rejected, or the radar found no matches.
        </p>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function JobTracker() {
  const [state, setState] = useState(loadState);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fitFilter, setFitFilter] = useState("all");
  const [sortBy, setSortBy] = useState("composite");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [expandedId, setExpandedId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [radar, setRadar] = useState(null);

  useEffect(
    () =>
      subscribe((key) => {
        if (key === KEYS.JOB_TRACKER) setState(loadState());
      }),
    []
  );

  // Load the daily radar output (first source that answers wins).
  useEffect(() => {
    let alive = true;
    (async () => {
      for (const src of RADAR_SOURCES) {
        try {
          const res = await fetch(`${src}?t=${Date.now()}`);
          if (!res.ok) continue;
          const data = await res.json();
          if (alive && Array.isArray(data.openings)) {
            setRadar(data);
            return;
          }
        } catch (_) {}
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((next) => {
    setState(next);
    saveJSON(KEYS.JOB_TRACKER, next);
  }, []);

  const patchCompany = useCallback(
    (id, patch) => {
      setState((prev) => {
        const existing = prev.companies[id] || {};
        const merged = { ...existing, ...patch };
        if (
          patch.status &&
          APPLIED_SET.has(patch.status) &&
          !APPLIED_SET.has(existing.status || "none") &&
          !existing.appliedAt
        ) {
          merged.appliedAt = Date.now();
        }
        if (patch.status && !APPLIED_SET.has(patch.status)) {
          delete merged.appliedAt;
        }
        const next = {
          ...prev,
          companies: { ...prev.companies, [id]: merged },
        };
        saveJSON(KEYS.JOB_TRACKER, next);
        return next;
      });
    },
    []
  );

  const addCustom = useCallback(
    (company) => {
      persist({ ...state, custom: [...state.custom, company] });
      setExpandedId(company.id);
      toast.success(`${company.name} added`);
    },
    [state, persist]
  );

  const allCompanies = useMemo(() => [...COMPANIES, ...state.custom], [state.custom]);

  const tiers = useMemo(() => [...new Set(allCompanies.map((c) => c.tier).filter(Boolean))].sort(), [allCompanies]);

  const entryOf = useCallback((id) => state.companies[id] || {}, [state.companies]);

  const companiesById = useMemo(() => Object.fromEntries(allCompanies.map((c) => [c.id, c])), [allCompanies]);

  const radarCoveredIds = useMemo(
    () => new Set(radar?.summary?.coveredCompanyIds || []),
    [radar]
  );

  // Radar minus openings already saved as links (tracked/applied ones never
  // reappear). Rejected keys stay in the feed — rendered crossed-out.
  const radarVisible = useMemo(() => {
    if (!radar) return null;
    const trackedUrls = new Set();
    Object.values(state.companies).forEach((e) =>
      (e.links || []).forEach((l) => trackedUrls.add(normUrl(l.url)))
    );
    const openings = radar.openings.filter((o) => !trackedUrls.has(normUrl(o.url)));
    return { ...radar, openings };
  }, [radar, state.companies]);

  // A rejected opening that no longer appears in the scan is gone for good —
  // drop its key so the map doesn't grow forever.
  useEffect(() => {
    if (!radar) return;
    const feedKeys = new Set(radar.openings.map((o) => o.key));
    setState((prev) => {
      const stale = Object.keys(prev.dismissedOpenings).filter((k) => !feedKeys.has(k));
      if (stale.length === 0) return prev;
      const dismissedOpenings = { ...prev.dismissedOpenings };
      stale.forEach((k) => delete dismissedOpenings[k]);
      const next = { ...prev, dismissedOpenings };
      saveJSON(KEYS.JOB_TRACKER, next);
      return next;
    });
  }, [radar]);

  const trackOpening = useCallback(
    (o) => {
      const entry = state.companies[o.companyId] || {};
      const patch = {
        links: [...(entry.links || []), { id: uid(), label: o.title, url: o.url, applied: false }],
      };
      if (!entry.status || entry.status === "none") patch.status = "toApply";
      patchCompany(o.companyId, patch);
      toast.success(`Queued in To Apply — ${o.company}`);
    },
    [state.companies, patchCompany]
  );

  const manualAddOpening = useCallback(
    (company, label, url) => {
      const entry = state.companies[company.id] || {};
      const patch = {
        links: [...(entry.links || []), { id: uid(), label, url, applied: false }],
      };
      if (!entry.status || entry.status === "none") patch.status = "toApply";
      patchCompany(company.id, patch);
      toast.success(`Queued in To Apply — ${company.name}`);
    },
    [state.companies, patchCompany]
  );

  const rejectOpening = useCallback((o) => {
    if (!window.confirm(`Reject "${o.title}" at ${o.company}? It will be crossed out and dropped after it leaves the scan.`)) return;
    setState((prev) => {
      const next = { ...prev, dismissedOpenings: { ...prev.dismissedOpenings, [o.key]: true } };
      saveJSON(KEYS.JOB_TRACKER, next);
      return next;
    });
  }, []);

  const unrejectOpening = useCallback((o) => {
    setState((prev) => {
      const dismissedOpenings = { ...prev.dismissedOpenings };
      delete dismissedOpenings[o.key];
      const next = { ...prev, dismissedOpenings };
      saveJSON(KEYS.JOB_TRACKER, next);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = allCompanies.filter((c) => {
      const e = state.companies[c.id] || {};
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
  }, [allCompanies, state.companies, search, tierFilter, statusFilter, fitFilter, sortBy]);

  const visible = filtered.slice(0, limit);

  const { toApplyList, appliedList, stats } = useMemo(() => {
    const toApply = [];
    const applied = [];
    let appliedCount = 0;
    let inProcess = 0;
    let offers = 0;
    let pendingOpenings = 0;
    allCompanies.forEach((c) => {
      const e = state.companies[c.id] || {};
      const status = e.status || "none";
      const links = e.links || [];
      const pending = links.filter((l) => !l.applied).length;
      pendingOpenings += pending;
      if (status === "toApply" || (pending > 0 && !APPLIED_SET.has(status))) toApply.push(c);
      if (APPLIED_SET.has(status) && status !== "rejected") applied.push(c);
      if (APPLIED_SET.has(status)) appliedCount += 1;
      if (status === "oa" || status === "interview") inProcess += 1;
      if (status === "offer") offers += 1;
    });
    return {
      toApplyList: toApply,
      appliedList: applied,
      stats: { total: allCompanies.length, toApply: toApply.length, applied: appliedCount, inProcess, offers, pendingOpenings },
    };
  }, [allCompanies, state.companies]);

  const jumpTo = useCallback((company) => {
    setSearch(company.name);
    setTierFilter("all");
    setStatusFilter("all");
    setFitFilter("all");
    setLimit(PAGE_SIZE);
    setExpandedId(company.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const selectCls =
    "text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100 cursor-pointer";

  const statTiles = [
    { label: "Companies", value: stats.total, cls: "text-gray-800 dark:text-gray-100" },
    { label: "To Apply", value: stats.toApply, cls: "text-amber-600 dark:text-amber-300" },
    { label: "Pending Openings", value: stats.pendingOpenings, cls: "text-orange-600 dark:text-orange-300" },
    { label: "Applied", value: stats.applied, cls: "text-blue-600 dark:text-blue-300" },
    { label: "In Process", value: stats.inProcess, cls: "text-violet-600 dark:text-violet-300" },
    { label: "Offers", value: stats.offers, cls: "text-emerald-600 dark:text-emerald-300" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-16">
      <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <h1 className="text-2xl lg:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 dark:from-indigo-400 dark:via-violet-400 dark:to-indigo-300">
            Job Application Tracker
          </h1>
          <button
            onClick={() => setAdding((a) => !a)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
          >
            <HiPlus /> Add company
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
          {statTiles.map((s) => (
            <div key={s.label} className={`${GLASS} rounded-xl px-3 py-2.5 text-center`}>
              <div className={`text-2xl font-extrabold ${s.cls}`}>{s.value}</div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <RadarBucket
          radar={radarVisible}
          companiesById={companiesById}
          allCompanies={allCompanies}
          rejectedKeys={state.dismissedOpenings}
          onTrack={trackOpening}
          onReject={rejectOpening}
          onUnreject={unrejectOpening}
          onManualAdd={manualAddOpening}
        />

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

        {/* Table */}
        <div className={`${GLASS} rounded-xl overflow-hidden mb-8`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-slate-800/80">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Pay (LPA)</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Tier</th>
                  <th className="px-4 py-3 hidden xl:table-cell">Category</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Location</th>
                  <th className="px-4 py-3 hidden md:table-cell">Culture</th>
                  <th className="px-4 py-3 hidden md:table-cell">Java Fit</th>
                  <th className="px-4 py-3 hidden md:table-cell">Match</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center" title="Applied / total openings">Apps</th>
                  <th className="px-2 py-3"></th>
                </tr>
              </thead>
              <tbody className="text-[15px]">
                {visible.map((c) => (
                  <CompanyRow
                    key={c.id}
                    company={c}
                    entry={entryOf(c.id)}
                    expanded={expandedId === c.id}
                    onToggle={() => setExpandedId((e) => (e === c.id ? null : c.id))}
                    onPatch={(patch) => patchCompany(c.id, patch)}
                    autoCovered={radarCoveredIds.has(c.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {visible.length === 0 && (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-10">No companies match these filters.</p>
          )}
          {filtered.length > limit && (
            <button
              onClick={() => setLimit((l) => l + PAGE_SIZE)}
              className="w-full py-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700/60 border-t border-gray-200/60 dark:border-slate-700/60"
            >
              Show {Math.min(PAGE_SIZE, filtered.length - limit)} more ({filtered.length - limit} remaining)
            </button>
          )}
        </div>

        {/* Bottom summaries */}
        <div className="grid md:grid-cols-2 gap-5">
          <section>
            <h2 className="text-lg font-bold text-amber-600 dark:text-amber-300 mb-2">
              To Apply Queue ({toApplyList.length})
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              Companies marked "To Apply" or with pending openings — knock these out first.
            </p>
            <div className="space-y-2">
              {toApplyList.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500">Nothing queued. Mark companies "To Apply" or add openings above.</p>
              )}
              {toApplyList.map((c) => (
                <SummaryCompany key={c.id} company={c} entry={entryOf(c.id)} onJump={() => jumpTo(c)} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-300 mb-2">
              Applied Companies ({appliedList.length})
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              Everything in flight — applied, OA, interviews and offers, with the openings per company.
            </p>
            <div className="space-y-2">
              {appliedList.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500">No applications yet — the queue on the left is waiting.</p>
              )}
              {appliedList.map((c) => (
                <SummaryCompany key={c.id} company={c} entry={entryOf(c.id)} onJump={() => jumpTo(c)} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
