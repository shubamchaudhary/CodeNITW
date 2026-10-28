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
import { GLASS, GLASS_PANEL, LIGHT_FIELD } from "../../components/glass";

// ── Constants ────────────────────────────────────────────────────────────────
export const STATUSES = {
  none: { label: "Not Started", cls: "bg-surface-hover text-fg-muted    " },
  toApply: { label: "To Apply", cls: "bg-warning-subtle text-warning-fg  " },
  applied: { label: "Applied", cls: "bg-surface-hover text-fg  " },
  oa: { label: "OA / Test", cls: "bg-surface-hover text-fg  " },
  interview: { label: "Interview", cls: "bg-brand-subtle text-brand-fg  " },
  offer: { label: "Offer", cls: "bg-success-subtle text-success-fg  " },
  rejected: { label: "Rejected", cls: "bg-danger-subtle text-danger-fg  " },
  skip: { label: "Skipped", cls: "bg-surface-hover text-fg-subtle    " },
};

export const APPLIED_SET = new Set(["applied", "oa", "interview", "offer", "rejected"]);

export const FIT_CLS = {
  "Very High": "text-success-fg font-semibold",
  High: "text-success-fg font-semibold",
  Medium: "text-warning-fg ",
  Low: "text-fg-subtle ",
};

export const FIT_RANK = { "Very High": 4, High: 3, Medium: 2, Low: 1 };

export const APPLIED_HIGHLIGHT_DAYS = 10;
export const PAGE_SIZE = 60;

// A "watched the careers page" marker auto-expires after this many days, so it
// keeps nudging you to re-check the page instead of staying green forever.
export const CAREER_WATCH_DAYS = 15;

// ── Utilities ────────────────────────────────────────────────────────────────
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
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

// "today", "3d ago" — or null when there's no date to show.
export function agoLabel(timestamp) {
  const d = daysSince(timestamp);
  if (d === Infinity) return null;
  return d === 0 ? "today" : `${d}d ago`;
}

// ── Pipeline stages ──────────────────────────────────────────────────────────
// Every job link is in exactly one stage:
//   toApply  — saved, not acted on yet
//   referral — asked someone for a referral, waiting
//   applied  — applied, directly or with a referral
//   closed   — rejected, or a referral ask that never got a reply
// The fields behind it: addedAt, applied/appliedAt (applied directly),
// referral/referralAt (asked), referralAppliedAt (applied with that
// referral), outcome/outcomeAt ("rejected"), closedReason/closedAt
// ("noReply"), touchedAt (last moved), and the older referralOutcome
// ("accepted"/"rejected") from before this model.

const isAppliedLink = (l) => !!(l.applied || l.referralAppliedAt);

export function linkStage(link, entry = {}) {
  if (link.outcome === "rejected" || link.referralOutcome === "rejected" || link.closedReason) return "closed";
  // A company marked Rejected closes every application to it.
  if (isAppliedLink(link)) return entry.status === "rejected" ? "closed" : "applied";
  return link.referral ? "referral" : "toApply";
}

// When it was applied for: the link's own date, else (older links) the company's.
export function appliedTime(link, entry = {}) {
  return link.referralAppliedAt || link.appliedAt || entry.appliedAt || null;
}

export function closedTime(link) {
  return link.outcomeAt || link.closedAt || link.referralOutcomeAt || null;
}

// ── Erasing what's gone cold ─────────────────────────────────────────────────
// A job link left untouched in its section for ERASE_AFTER_DAYS is erased —
// except an application to a company at OA / Interview / Offer, which is live.
// The company's own status and applied date (the Companies tab) are kept.
export const ERASE_AFTER_DAYS = 45;
// The last week before that, the card says so.
export const ERASE_WARN_DAYS = 7;
const LIVE_STATUSES = new Set(["oa", "interview", "offer"]);

// When the link entered its current section.
function stageTime(link, entry) {
  switch (linkStage(link, entry)) {
    case "toApply":
      return link.addedAt;
    case "referral":
      return link.referralAt;
    case "applied":
      return appliedTime(link, entry);
    default:
      return closedTime(link) || appliedTime(link, entry);
  }
}

// Days left before the link is erased; null when it never will be (a live
// application, or a link with no date to go by).
export function daysToErase(link, entry = {}) {
  if (linkStage(link, entry) === "applied" && LIVE_STATUSES.has(entry.status)) return null;
  const touched = Math.max(stageTime(link, entry) || 0, link.touchedAt || 0);
  if (!touched) return null;
  return ERASE_AFTER_DAYS - daysSince(touched);
}

// The companies map with the cold links erased, or null when none are. A
// company whose every link went keeps its status — except "To Apply", which
// only meant those links, so it's cleared too.
export function eraseCold(companies) {
  let erased = 0;
  const next = {};
  Object.entries(companies || {}).forEach(([id, entry]) => {
    const links = entry.links || [];
    const kept = links.filter((l) => {
      const left = daysToErase(l, entry);
      return left === null || left > 0;
    });
    erased += links.length - kept.length;
    if (kept.length === links.length) next[id] = entry;
    else next[id] = { ...entry, links: kept, ...(!kept.length && entry.status === "toApply" ? { status: "none" } : {}) };
  });
  return erased ? { companies: next, erased } : null;
}

// A company typed in that isn't in the list yet: same shape as the roster's.
export function customCompany({ name, pay = "", location = "", category = "", careers = "" }) {
  return {
    id: `custom-${uid()}`,
    name: name.trim(),
    tier: "Custom",
    category: category.trim(),
    location: location.trim(),
    remote: "",
    culture: null,
    pay: pay.trim(),
    javaFit: "",
    match: "",
    template: "",
    careers: careers ? normalizeUrl(careers) : "",
    notes: "",
    ncr: false,
    score: 0,
    customEntry: true,
  };
}

export function isRecentlyApplied(entry) {
  if (!entry.appliedAt) return false;
  const status = entry.status || "none";
  if (!APPLIED_SET.has(status)) return false;
  return daysSince(entry.appliedAt) <= APPLIED_HIGHLIGHT_DAYS;
}

// ── Small building blocks ────────────────────────────────────────────────────
export function CultureStars({ n }) {
  if (!n) return <span className="text-fg-subtle">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5 text-warning-fg" title={`Culture ${n}/5`}>
      {n}
      <HiStar className="inline" />
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
      className={`text-xs font-semibold rounded-lg px-2 py-1.5 border-0 cursor-pointer focus:ring-2 focus:ring-focus ${STATUSES[v].cls}`}
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
    `text-sm px-2 py-1.5 rounded-lg border border-line-strong bg-canvas ${LIGHT_FIELD}`;

  return (
    <div>
      <div className="text-xs font-semibold text-fg-subtle mb-2">
        HR / Recruiter Contacts
      </div>
      {contacts.length === 0 && (
        <p className="text-xs text-fg-subtle mb-2">
          No contacts added yet — add recruiters, HRs, or referrers below.
        </p>
      )}
      <ul className="space-y-1.5 mb-3">
        {contacts.map((c) => (
          <li key={c.id} className="flex items-center gap-3 text-sm text-fg-muted">
            <span className="font-medium">{c.name || "—"}</span>
            {c.phone && (
              <span className="inline-flex items-center gap-1 text-xs text-fg-subtle">
                <HiPhone className="text-success-fg" />
                <a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a>
              </span>
            )}
            {c.email && (
              <span className="inline-flex items-center gap-1 text-xs text-fg-subtle">
                <HiMail className="text-fg" />
                <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a>
              </span>
            )}
            <button
              onClick={() => onChange(contacts.filter((x) => x.id !== c.id))}
              className="text-fg-subtle hover:text-fg shrink-0 ml-auto"
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
          className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-on-primary"
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
    onChange([...links, { id: uid(), label: label.trim() || "Opening", url: u, applied: false, addedAt: Date.now() }]);
    setLabel("");
    setUrl("");
  };

  const inputCls =
    `text-sm px-2 py-1.5 rounded-lg border border-line-strong bg-canvas ${LIGHT_FIELD}`;

  return (
    <div>
      <div className="text-xs font-semibold text-fg-subtle mb-2">
        Openings / Apply Links
      </div>
      {links.length === 0 && (
        <p className="text-xs text-fg-subtle mb-2">
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
                  ? "text-success-fg "
                  : "text-brand-fg "
              }`}
              title={l.url}
            >
              {l.label} <HiOutlineExternalLink className="inline mb-0.5" />
            </a>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                l.applied
                  ? "bg-success-subtle text-success-fg "
                  : "bg-warning-subtle text-warning-fg "
              }`}
            >
              {l.applied ? "APPLIED" : "PENDING"}
            </span>
            <button
              onClick={() => onChange(links.filter((x) => x.id !== l.id))}
              className="text-fg-subtle hover:text-fg shrink-0"
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
          className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-on-primary"
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
      <div className="text-xs font-semibold text-fg-subtle mb-2">
        Notes (JR IDs, referrer, next step…)
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft !== (note || "") && onSave(draft)}
        rows={3}
        placeholder="e.g. JR-12345 · referred by X · OA on 15th"
        className="w-full text-sm px-2 py-1.5 rounded-lg border border-line-strong bg-canvas resize-y"
      />
    </div>
  );
}

// ── Expanded row detail ──────────────────────────────────────────────────────
// `templates` are the owner's referral messages — null for everyone else, and
// then the template section simply isn't there.
export function CompanyDetail({ company, entry, onPatch, templates }) {
  const template = templates ? templates[company.template] : null;
  const [showTemplate, setShowTemplate] = useState(false);

  return (
    <div className={`${GLASS_PANEL} rounded-lg p-5 space-y-5`}>
      <LinksEditor links={entry.links || []} onChange={(links) => onPatch({ links })} />
      <HRContactsEditor contacts={entry.hrContacts || []} onChange={(hrContacts) => onPatch({ hrContacts })} />
      <NoteEditor note={entry.note} onSave={(note) => onPatch({ note })} />

      {template && (
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowTemplate((s) => !s)}
              className="text-xs font-semibold text-brand-fg hover:underline"
            >
              {showTemplate ? "Hide" : "Show"} referral template ({company.template})
            </button>
            <button
              onClick={() => copyText(template.message, "Referral message copied")}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-surface-hover text-fg-muted hover:bg-surface-hover"
            >
              <HiOutlineClipboardCopy /> Copy message
            </button>
          </div>
          {showTemplate && (
            <pre className="mt-2 text-xs whitespace-pre-wrap text-fg-muted bg-surface-subtle rounded-lg p-3 border border-line">
              {template.message}
            </pre>
          )}
        </div>
      )}

      {company.notes && (
        <p className="text-xs text-fg-subtle">
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
    onAdd(customCompany(form));
    onClose();
  };

  const inputCls =
    `text-sm px-2 py-1.5 rounded-lg border border-line-strong bg-canvas ${LIGHT_FIELD}`;
  return (
    <div className={`${GLASS} rounded-lg p-4 mb-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-fg text-base">Add a company</h3>
        <button onClick={onClose} className="text-fg-subtle hover:text-fg">
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
          className="inline-flex items-center gap-1 text-sm font-semibold px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-on-primary"
        >
          <HiPlus /> Add company
        </button>
      </div>
      <p className="text-xs text-fg-subtle mt-2">
        Use this for any company not in the list — it gets the same status + apply-links tracking.
      </p>
    </div>
  );
}
