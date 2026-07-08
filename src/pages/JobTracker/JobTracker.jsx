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
} from "react-icons/hi";
import { GLASS, GLASS_PANEL } from "../../components/glass";
import { KEYS, loadJSON, saveJSON, subscribe } from "../../Data/planStore";
import {
  COMPANIES,
  REFERRAL_TEMPLATES,
  TOP_PICKS,
} from "../../Data/jobTrackerCompanies";

// ─── Status model ─────────────────────────────────────────────────────────────
const STATUSES = {
  none: { label: "Not Started", cls: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400" },
  toApply: { label: "To Apply", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  applied: { label: "Applied", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  oa: { label: "OA / Test", cls: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" },
  interview: { label: "Interview", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  offer: { label: "Offer 🎉", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300" },
  skip: { label: "Skipped", cls: "bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-gray-500" },
};
// Statuses meaning "I have an application in flight (or done) with them".
const APPLIED_SET = new Set(["applied", "oa", "interview", "offer", "rejected"]);

const FIT_CLS = {
  "Very High": "text-emerald-600 dark:text-emerald-400 font-bold",
  High: "text-green-600 dark:text-green-400 font-semibold",
  Medium: "text-amber-600 dark:text-amber-400",
  Low: "text-gray-400 dark:text-gray-500",
};

const TOP_PICK_BY_NAME = Object.fromEntries(TOP_PICKS.map((p) => [p.company, p]));

const PAGE_SIZE = 60;

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// State shape (persisted + cloud-synced under KEYS.JOB_TRACKER):
//   { companies: { [id]: { status, links: [{id,label,url,applied}], note, jrId } },
//     custom: [ {id, name, tier, category, location, pay, careers, ...} ] }
function loadState() {
  const s = loadJSON(KEYS.JOB_TRACKER, {});
  return { companies: s.companies || {}, custom: s.custom || [] };
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

// ─── Small building blocks ────────────────────────────────────────────────────
function CultureStars({ n }) {
  if (!n) return <span className="text-gray-400">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" title={`Culture ${n}/5`}>
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
      className={`text-xs font-semibold rounded-lg px-2 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-indigo-400 ${STATUSES[v].cls}`}
    >
      {Object.entries(STATUSES).map(([k, s]) => (
        <option key={k} value={k}>
          {s.label}
        </option>
      ))}
    </select>
  );
}

// ─── Apply-links manager (inside the expanded row) ────────────────────────────
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
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-indigo-600 dark:text-indigo-400"
              }`}
              title={l.url}
            >
              {l.label} <HiOutlineExternalLink className="inline mb-0.5" />
            </a>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                l.applied
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
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
          className="text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-gray-200 w-44"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="https://… job opening link"
          className="text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-gray-200 flex-1 min-w-[200px]"
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

// Notes with a local draft — saved on blur so typing doesn't re-render the table.
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
        className="w-full text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-gray-200 resize-y"
      />
    </div>
  );
}

// ─── Expanded row detail ──────────────────────────────────────────────────────
function CompanyDetail({ company, entry, onPatch }) {
  const pick = TOP_PICK_BY_NAME[company.name];
  const template = REFERRAL_TEMPLATES[company.template];
  const [showTemplate, setShowTemplate] = useState(false);

  return (
    <div className={`${GLASS_PANEL} rounded-xl p-4 space-y-4`}>
      {pick && (
        <div className="text-sm bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800/40 rounded-lg p-3">
          <span className="font-bold text-pink-600 dark:text-pink-400">
            ⭐ Top Pick #{pick.rank}:
          </span>{" "}
          <span className="text-gray-700 dark:text-gray-300">{pick.why}</span>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 italic">{pick.hook}</p>
        </div>
      )}

      <LinksEditor links={entry.links || []} onChange={(links) => onPatch({ links })} />
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
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
            >
              <HiOutlineClipboardCopy /> Copy message
            </button>
          </div>
          {showTemplate && (
            <pre className="mt-2 text-xs whitespace-pre-wrap text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
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

// ─── One table row ────────────────────────────────────────────────────────────
const CompanyRow = memo(function CompanyRow({ company, entry, expanded, onToggle, onPatch }) {
  const links = entry.links || [];
  const pending = links.filter((l) => !l.applied).length;
  const status = entry.status || "none";
  const pick = TOP_PICK_BY_NAME[company.name];

  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer border-b border-gray-100 dark:border-slate-800 hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 transition-colors ${
          status === "skip" ? "opacity-45" : ""
        }`}
      >
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-800 dark:text-gray-200">{company.name}</span>
            {pick && (
              <span title={`Top pick #${pick.rank}`} className="text-pink-500 text-xs font-bold">
                ⭐{pick.rank}
              </span>
            )}
            {company.customEntry && (
              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300">
                MINE
              </span>
            )}
            {company.careers && (
              <a
                href={company.careers}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300"
                title="Careers page"
              >
                <HiOutlineExternalLink />
              </a>
            )}
          </div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500 lg:hidden">
            {company.pay && `₹${company.pay} LPA · `}
            {company.location}
          </div>
        </td>
        <td className="px-3 py-2.5 whitespace-nowrap font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">
          {company.pay ? `₹${company.pay}` : "—"}
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400 hidden lg:table-cell">{company.tier}</td>
        <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400 hidden xl:table-cell">{company.category}</td>
        <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400 hidden lg:table-cell max-w-[160px] truncate" title={company.location}>
          {company.location}
        </td>
        <td className="px-3 py-2.5 text-sm hidden md:table-cell">
          <CultureStars n={company.culture} />
        </td>
        <td className={`px-3 py-2.5 text-xs hidden md:table-cell ${FIT_CLS[company.javaFit] || "text-gray-400"}`}>
          {company.javaFit || "—"}
        </td>
        <td className={`px-3 py-2.5 text-xs hidden md:table-cell ${FIT_CLS[company.match] || "text-gray-400"}`}>
          {company.match || "—"}
        </td>
        <td className="px-3 py-2.5">
          <StatusSelect value={status} onChange={(v) => onPatch({ status: v })} />
        </td>
        <td className="px-3 py-2.5 text-center">
          {links.length > 0 ? (
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                pending
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              }`}
              title={`${links.length} openings, ${pending} pending`}
            >
              {links.length - pending}/{links.length}
            </span>
          ) : (
            <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
          )}
        </td>
        <td className="px-2 py-2.5 text-gray-400">
          <HiChevronDown className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-gray-100 dark:border-slate-800">
          <td colSpan={11} className="px-3 pb-4 pt-1 bg-gray-50/50 dark:bg-slate-900/30">
            <CompanyDetail company={company} entry={entry} onPatch={onPatch} />
          </td>
        </tr>
      )}
    </>
  );
});

// ─── Add-your-own-company form ────────────────────────────────────────────────
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
    "text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-gray-200";
  return (
    <div className={`${GLASS} rounded-xl p-4 mb-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 dark:text-gray-200">Add a company</h3>
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
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
        Use this for any company not in the list — it gets the same status + apply-links tracking.
      </p>
    </div>
  );
}

// ─── Bottom summary sections ──────────────────────────────────────────────────
function SummaryCompany({ company, entry, onJump }) {
  const links = entry.links || [];
  return (
    <div className={`${GLASS_PANEL} rounded-xl p-3`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={onJump}
          className="font-semibold text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-left"
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
      {entry.note && <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500 truncate">{entry.note}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function JobTracker() {
  const [state, setState] = useState(loadState);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fitFilter, setFitFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [expandedId, setExpandedId] = useState(null);
  const [adding, setAdding] = useState(false);

  // Live-sync with cloud pushes from other devices.
  useEffect(
    () =>
      subscribe((key) => {
        if (key === KEYS.JOB_TRACKER) setState(loadState());
      }),
    []
  );

  const persist = useCallback((next) => {
    setState(next);
    saveJSON(KEYS.JOB_TRACKER, next);
  }, []);

  const patchCompany = useCallback(
    (id, patch) => {
      setState((prev) => {
        const next = {
          ...prev,
          companies: { ...prev.companies, [id]: { ...(prev.companies[id] || {}), ...patch } },
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
    if (sortBy === "score") list.sort((a, b) => b.score - a.score);
    else if (sortBy === "culture") list.sort((a, b) => (b.culture || 0) - (a.culture || 0) || b.score - a.score);
    else if (sortBy === "pay") list.sort((a, b) => payMax(b) - payMax(a));
    else if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [allCompanies, state.companies, search, tierFilter, statusFilter, fitFilter, sortBy]);

  const visible = filtered.slice(0, limit);

  // Bottom sections + stats derive from the SAME state, so they always agree.
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

  // Searching by name guarantees the row is on the first page before expanding.
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
    "text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-gray-200 cursor-pointer";

  const statTiles = [
    { label: "Companies", value: stats.total, cls: "text-gray-800 dark:text-gray-200" },
    { label: "To Apply", value: stats.toApply, cls: "text-amber-600 dark:text-amber-400" },
    { label: "Pending Openings", value: stats.pendingOpenings, cls: "text-orange-600 dark:text-orange-400" },
    { label: "Applied", value: stats.applied, cls: "text-blue-600 dark:text-blue-400" },
    { label: "In Process", value: stats.inProcess, cls: "text-violet-600 dark:text-violet-400" },
    { label: "Offers", value: stats.offers, cls: "text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <div className="max-w-screen-2xl mx-auto px-3 lg:px-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 dark:from-indigo-400 dark:via-violet-400 dark:to-indigo-300">
            Job Application Tracker
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            SDE-2 hunt · target ₹40–50 LPA · sorted by fit for your Java/Spring + Snowflake profile
          </p>
        </div>
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
          <div key={s.label} className={`${GLASS} rounded-xl px-3 py-2 text-center`}>
            <div className={`text-xl font-extrabold ${s.cls}`}>{s.value}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {s.label}
            </div>
          </div>
        ))}
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
            className="w-full text-sm pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-gray-200"
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
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-slate-900/60">
              <tr>
                <th className="px-3 py-2.5">Company</th>
                <th className="px-3 py-2.5 hidden sm:table-cell">Pay (LPA)</th>
                <th className="px-3 py-2.5 hidden lg:table-cell">Tier</th>
                <th className="px-3 py-2.5 hidden xl:table-cell">Category</th>
                <th className="px-3 py-2.5 hidden lg:table-cell">Location</th>
                <th className="px-3 py-2.5 hidden md:table-cell">Culture</th>
                <th className="px-3 py-2.5 hidden md:table-cell">Java Fit</th>
                <th className="px-3 py-2.5 hidden md:table-cell">Match</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-center" title="Applied / total openings">Apps</th>
                <th className="px-2 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <CompanyRow
                  key={c.id}
                  company={c}
                  entry={entryOf(c.id)}
                  expanded={expandedId === c.id}
                  onToggle={() => setExpandedId((e) => (e === c.id ? null : c.id))}
                  onPatch={(patch) => patchCompany(c.id, patch)}
                />
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">No companies match these filters.</p>
        )}
        {filtered.length > limit && (
          <button
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
            className="w-full py-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800/60 border-t border-gray-100 dark:border-slate-800"
          >
            Show {Math.min(PAGE_SIZE, filtered.length - limit)} more ({filtered.length - limit} remaining)
          </button>
        )}
      </div>

      {/* Bottom summaries */}
      <div className="grid md:grid-cols-2 gap-5">
        <section>
          <h2 className="text-lg font-bold text-amber-600 dark:text-amber-400 mb-2">
            📌 To Apply Queue ({toApplyList.length})
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            Companies marked "To Apply" or with pending openings — knock these out first.
          </p>
          <div className="space-y-2">
            {toApplyList.length === 0 && (
              <p className="text-sm text-gray-400">Nothing queued. Mark companies "To Apply" or add openings above.</p>
            )}
            {toApplyList.map((c) => (
              <SummaryCompany key={c.id} company={c} entry={entryOf(c.id)} onJump={() => jumpTo(c)} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-2">
            ✅ Applied Companies ({appliedList.length})
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            Everything in flight — applied, OA, interviews and offers, with the openings per company.
          </p>
          <div className="space-y-2">
            {appliedList.length === 0 && (
              <p className="text-sm text-gray-400">No applications yet — the queue on the left is waiting.</p>
            )}
            {appliedList.map((c) => (
              <SummaryCompany key={c.id} company={c} entry={entryOf(c.id)} onJump={() => jumpTo(c)} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
