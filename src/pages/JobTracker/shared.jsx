import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  HiOutlineExternalLink,
  HiPlus,
  HiTrash,
  HiOutlineClipboardCopy,
  HiStar,
  HiX,
  HiPhone,
  HiMail,
} from "react-icons/hi";
import { GLASS, GLASS_PANEL } from "../../components/glass";
import { REFERRAL_TEMPLATES } from "../../Data/jobTrackerCompanies";

// ── Constants ────────────────────────────────────────────────────────────────
export const STATUSES = {
  none: { label: "Not Started", cls: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300" },
  toApply: { label: "To Apply", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200" },
  applied: { label: "Applied", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200" },
  oa: { label: "OA / Test", cls: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-200" },
  interview: { label: "Interview", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200" },
  offer: { label: "Offer", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-200" },
  skip: { label: "Skipped", cls: "bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-gray-500" },
};

export const APPLIED_SET = new Set(["applied", "oa", "interview", "offer", "rejected"]);

export const FIT_CLS = {
  "Very High": "text-emerald-600 dark:text-emerald-300 font-bold",
  High: "text-green-600 dark:text-green-300 font-semibold",
  Medium: "text-amber-600 dark:text-amber-300",
  Low: "text-gray-400 dark:text-gray-500",
};

export const FIT_RANK = { "Very High": 4, High: 3, Medium: 2, Low: 1 };

export const APPLIED_HIGHLIGHT_DAYS = 10;
export const PAGE_SIZE = 60;
export const RADAR_NEW_DAYS = 3;

// Only surface openings you're a real fit for: at least this résumé-match %…
export const MIN_MATCH_SCORE = 40;
// …and no more than this many years of experience required.
export const MAX_YOE = 4;

// Title words that imply well over 4 YoE, used when the JD didn't state a
// number (the radar drops JD-stated >4 at scan time; this catches the rest).
const SENIOR_TITLE_RX = /\b(senior|sr\.?|staff|principal|lead|architect|distinguished|fellow|l[5-9])\b/i;

// True when an opening fits the ≤4-YoE bar. A JD-parsed `minYoe` is
// authoritative; otherwise fall back to the title seniority signal.
export function withinYoe(o) {
  if (typeof o.minYoe === "number") return o.minYoe <= MAX_YOE;
  return !SENIOR_TITLE_RX.test(o.title || "");
}

// The single gate the Openings list applies per row: strong enough match AND
// within the experience ceiling.
export function isOpeningEligible(o) {
  const score = typeof o.matchScore === "number" ? o.matchScore : -1;
  return score >= MIN_MATCH_SCORE && withinYoe(o);
}

export const RADAR_SOURCES = [
  "https://raw.githubusercontent.com/shubamchaudhary/CodeNITW/main/radar/openings.json",
  "https://raw.githubusercontent.com/shubamchaudhary/CodeNITW/claude/job-application-tracker-nqpn76/radar/openings.json",
];

// ── Utilities ────────────────────────────────────────────────────────────────
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function normUrl(url) {
  return (url || "").replace(/^https?:\/\//, "").replace(/[?#].*$/, "").replace(/\/$/, "").toLowerCase();
}

// Stable per-opening identity used to persist dismissals. Based purely on the
// posting URL (unique per opening and stable across scans/redeploys), so a
// dismissal survives new deployments and transient feed gaps. The radar's `key`
// is deliberately NOT used — it can collide (Workday emits one id for several
// postings) and its format isn't guaranteed stable. Falls back to `key` only
// when an opening has no URL.
export function uKeyOf(o) {
  return normUrl(o.url) || o.key;
}

// Dismissed openings are retained for this long (6 months) regardless of
// deployments or transient feed gaps, then purged by age so the map can't grow
// forever.
export const DISMISS_TTL_DAYS = 180;

// One-time, idempotent migration of the dismissedOpenings map to the current
// format: URL-only keys with numeric-timestamp values. Handles both legacy
// shapes so crosses made before this change survive the deploy:
//   • value `true`               → Date.now() (starts the 6-month clock now)
//   • key `"<hash>|<normurl>"`    → "<normurl>" (drop the volatile hash prefix)
//   • key `"<normurl>"`           → kept as-is
//   • key `"<hash>"` (no url)     → kept as-is (can't recover a URL; harmless)
// Returns { map, changed } so callers can persist only when something moved.
export function migrateDismissals(dismissed) {
  const out = {};
  let changed = false;
  for (const [rawKey, rawVal] of Object.entries(dismissed || {})) {
    // A "<hash>|<url>" key: everything after the first "|" is the normalized URL.
    const pipe = rawKey.indexOf("|");
    const key = pipe === -1 ? rawKey : rawKey.slice(pipe + 1);
    const val = typeof rawVal === "number" ? rawVal : Date.now();
    if (key !== rawKey || val !== rawVal) changed = true;
    // If two legacy keys collapse to the same URL, keep the newest timestamp.
    out[key] = out[key] ? Math.max(out[key], val) : val;
  }
  return { map: out, changed };
}

export function normalizeUrl(url) {
  const u = url.trim();
  if (!u) return "";
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export function copyText(text, msg) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(msg || "Copied!"))
    .catch(() => toast.error("Copy failed"));
}

export function daysSince(timestamp) {
  if (!timestamp) return Infinity;
  return Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
}

export function isRecentlyApplied(entry) {
  if (!entry.appliedAt) return false;
  const status = entry.status || "none";
  if (!APPLIED_SET.has(status)) return false;
  return daysSince(entry.appliedAt) <= APPLIED_HIGHLIGHT_DAYS;
}

// ── Small building blocks ────────────────────────────────────────────────────
export function CultureStars({ n }) {
  if (!n) return <span className="text-gray-400 dark:text-gray-500">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500 dark:text-amber-400" title={`Culture ${n}/5`}>
      {n}
      <HiStar className="inline" />
    </span>
  );
}

// ── Résumé-match score badge ─────────────────────────────────────────────────
// `matchScore` (0–100) is precomputed by the radar (scripts/scoreOpening.mjs)
// from your radar/skills.json against each opening's full job description.
export function scoreBand(score) {
  if (score == null) return "none";
  if (score >= 75) return "high";
  if (score >= 50) return "mid";
  if (score >= 25) return "low";
  return "min";
}

const SCORE_BAND_CLS = {
  high: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200",
  mid: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200",
  low: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200",
  min: "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400",
};

export function ScoreBadge({ score, matched, basis }) {
  if (score == null) return null;
  const band = scoreBand(score);
  const title =
    basis === "title"
      ? "Estimate from title only (no job description available)"
      : matched?.length
      ? "Match: " + matched.map((m) => (m.type === "want" ? `${m.skill} (grow)` : m.skill)).join(", ")
      : "No overlap with your skills list";
  return (
    <span
      className={`shrink-0 inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${SCORE_BAND_CLS[band]}`}
      title={title}
    >
      {score}
      <span className="ml-0.5 font-semibold opacity-70">fit</span>
    </span>
  );
}


export function StatusSelect({ value, onChange }) {
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
export function HRContactsEditor({ contacts, onChange }) {
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
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name / role (e.g. HR, Recruiter)" className={`${inputCls} w-44`} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className={`${inputCls} w-40`} />
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
export function LinksEditor({ links, onChange }) {
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
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Role (e.g. SDE-2 Backend)" className={`${inputCls} w-44`} />
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

// ── Note editor ──────────────────────────────────────────────────────────────
export function NoteEditor({ note, onSave }) {
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
export function CompanyDetail({ company, entry, onPatch }) {
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

// ── Add-your-own-company form ────────────────────────────────────────────────
export function AddCompanyForm({ onAdd, onClose }) {
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
