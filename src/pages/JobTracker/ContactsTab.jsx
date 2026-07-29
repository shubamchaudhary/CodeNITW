import React, { useState, useMemo } from "react";
import { toast } from "react-toastify";
import {
  HiPlus,
  HiX,
  HiOutlineSearch,
  HiOutlineClipboardCopy,
  HiPhone,
  HiMail,
  HiTrash,
  HiPencil,
  HiChat,
} from "react-icons/hi";
import { GLASS, GLASS_PANEL } from "../../components/glass";
import { SEED_HR_CONTACTS } from "../../Data/hrContacts";
import { copyText, daysSince, PAGE_SIZE } from "./shared";

// Digits-only phone, used for tel:/wa.me links and dedupe.
const digits = (s) => (s || "").replace(/\D/g, "");

// ── Outreach channels ───────────────────────────────────────────────────────
// Each contact records when you last reached out on each channel, so the card
// can show how long ago it was and you know who is due a follow-up.
export const REACH_CHANNELS = [
  {
    key: "whatsappAt",
    label: "WhatsApp",
    Icon: HiChat,
    on: "bg-emerald-600 text-white shadow-sm",
    off: "border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30",
  },
  {
    key: "callAt",
    label: "Call",
    Icon: HiPhone,
    on: "bg-blue-600 text-white shadow-sm",
    off: "border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30",
  },
  {
    key: "emailAt",
    label: "Email",
    Icon: HiMail,
    on: "bg-violet-600 text-white shadow-sm",
    off: "border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30",
  },
];

// "today" / "1d" / "12d" — compact enough to sit inside the toggle button.
function agoLabel(ts) {
  const d = daysSince(ts);
  if (d === Infinity) return "";
  return d === 0 ? "today" : `${d}d`;
}

// Most recent outreach across all channels (0 when never contacted).
export function lastReachedAt(c) {
  return Math.max(0, ...REACH_CHANNELS.map((ch) => c[ch.key] || 0));
}

// ── Add / edit contact form ─────────────────────────────────────────────────
function ContactForm({ allCompanies, initial, onSave, onClose }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    company: initial?.company || "",
    phone: initial?.phone || "",
    email: initial?.email || "",
    note: initial?.note || "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    if (!form.name.trim() && !form.phone.trim() && !form.email.trim()) {
      toast.warn("Enter at least a name, phone or email");
      return;
    }
    // Link to a roster company when the typed name matches one exactly.
    const match = allCompanies.find(
      (c) => c.name.toLowerCase() === form.company.trim().toLowerCase()
    );
    onSave({
      name: form.name.trim(),
      company: match ? match.name : form.company.trim(),
      companyId: match ? match.id : null,
      phone: form.phone.trim(),
      email: form.email.trim(),
      note: form.note.trim(),
    });
    onClose();
  };

  const inputCls =
    "text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100";

  return (
    <div className={`${GLASS} rounded-xl p-4 mb-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base">
          {initial ? "Edit contact" : "Add HR contact"}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500">
          <HiX />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={form.name} onChange={set("name")} placeholder="Name (e.g. Sneha)" className={`${inputCls} w-44`} autoFocus />
        <input
          list="contact-company-names"
          value={form.company}
          onChange={set("company")}
          placeholder="Company"
          className={`${inputCls} w-44`}
        />
        <datalist id="contact-company-names">
          {allCompanies.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
        <input value={form.phone} onChange={set("phone")} placeholder="Phone (+91 …)" className={`${inputCls} w-40`} />
        <input value={form.email} onChange={set("email")} placeholder="Email" className={`${inputCls} flex-1 min-w-[180px]`} />
        <input value={form.note} onChange={set("note")} placeholder="Note (role, where you met…)" className={`${inputCls} flex-1 min-w-[160px]`} />
        <button
          onClick={submit}
          className="inline-flex items-center gap-1 text-sm font-semibold px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <HiPlus /> {initial ? "Save" : "Add contact"}
        </button>
      </div>
    </div>
  );
}

// ── One contact row ─────────────────────────────────────────────────────────
function ContactCard({ c, onEdit, onDelete, onToggleReach }) {
  const tel = digits(c.phone);
  // Everything worth pasting into a message, in one copy.
  const full = [c.name, c.company, c.phone, c.email, c.note].filter(Boolean).join(" · ");

  return (
    <div className={`${GLASS_PANEL} rounded-xl px-3 py-2.5 hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-[15px]">
              {c.name || "—"}
            </span>
            {c.company && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300">
                {c.company}
              </span>
            )}
            {c.source === "company" && (
              <span
                className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                title="Saved on the company card in the Companies tab"
              >
                COMPANY
              </span>
            )}
            {c.source === "custom" && (
              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">
                MINE
              </span>
            )}
          </div>

          {/* Phone + email lines, each individually copyable */}
          <div className="mt-1 space-y-0.5">
            {c.phone && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                <HiPhone className="text-emerald-500 shrink-0" />
                <a href={`tel:${tel}`} className="hover:underline">{c.phone}</a>
                <button
                  onClick={() => copyText(c.phone, "Phone copied")}
                  className="text-gray-400 hover:text-indigo-500"
                  title="Copy phone"
                >
                  <HiOutlineClipboardCopy className="w-3.5 h-3.5" />
                </button>
                {c.wa && (
                  <a
                    href={`https://wa.me/${c.wa}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                    title="Open WhatsApp chat"
                  >
                    <HiChat className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
            {c.email && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                <HiMail className="text-blue-500 shrink-0" />
                <a href={`mailto:${c.email}`} className="hover:underline truncate">{c.email}</a>
                <button
                  onClick={() => copyText(c.email, "Email copied")}
                  className="text-gray-400 hover:text-indigo-500 shrink-0"
                  title="Copy email"
                >
                  <HiOutlineClipboardCopy className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {c.note && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{c.note}</p>
            )}
          </div>

          {/* Outreach tracking — one toggle per channel, each showing how long
              ago you reached out so follow-ups are obvious at a glance. */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {REACH_CHANNELS.map(({ key, label, Icon, on, off }) => {
              const ts = c[key];
              const active = !!ts;
              const ago = agoLabel(ts);
              return (
                <button
                  key={key}
                  onClick={() => onToggleReach(c, key)}
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-1 rounded-lg transition-colors ${
                    active ? on : off
                  }`}
                  title={
                    active
                      ? `${label}: reached out ${ago === "today" ? "today" : `${ago} ago`} (${new Date(
                          ts
                        ).toLocaleDateString()}) — click to clear`
                      : `Mark that you reached out via ${label}`
                  }
                >
                  <Icon className="w-3 h-3" />
                  {label}
                  {active && ago && <span className="font-extrabold opacity-90">· {ago}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => copyText(full, "Contact copied")}
            className="text-gray-400 hover:text-indigo-500 p-1"
            title="Copy whole contact"
          >
            <HiOutlineClipboardCopy className="w-4 h-4" />
          </button>
          <button onClick={onEdit} className="text-gray-400 hover:text-indigo-500 p-1" title="Edit">
            <HiPencil className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-500 p-1" title="Remove">
            <HiTrash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Contacts tab ────────────────────────────────────────────────────────────
export default function ContactsTab({
  allCompanies,
  companies,
  customContacts,
  contactEdits,
  onAddContact,
  onEditContact,
  onPatchContact,
  onDeleteContact,
}) {
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [reachFilter, setReachFilter] = useState("all");
  const [withEmail, setWithEmail] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const companyName = useMemo(
    () => Object.fromEntries(allCompanies.map((c) => [c.id, c.name])),
    [allCompanies]
  );

  // Three sources merged into one list:
  //  • seed    — imported from the WhatsApp vCard (read-only base, patched by edits)
  //  • company — hrContacts saved on a company card in the Companies tab
  //  • custom  — added right here
  const contacts = useMemo(() => {
    const out = [];

    for (const s of SEED_HR_CONTACTS) {
      const patch = contactEdits[s.id];
      if (patch?.deleted) continue;
      out.push({ ...s, ...patch, source: "seed" });
    }

    Object.entries(companies).forEach(([cid, entry]) => {
      (entry.hrContacts || []).forEach((hc) => {
        const id = `co-${cid}-${hc.id}`;
        const patch = contactEdits[id];
        if (patch?.deleted) return;
        out.push({
          id,
          name: hc.name,
          phone: hc.phone,
          email: hc.email,
          company: companyName[cid] || "",
          companyId: cid,
          ...patch,
          source: "company",
        });
      });
    });

    for (const c of customContacts) {
      const patch = contactEdits[c.id];
      if (patch?.deleted) continue;
      out.push({ ...c, ...patch, source: "custom" });
    }

    // Same person saved in two places (vCard + company card) collapses to one
    // row, keeping whichever copy carries the most detail.
    const byPhone = new Map();
    const result = [];
    for (const c of out) {
      const k = digits(c.phone);
      if (!k) {
        result.push(c);
        continue;
      }
      const prev = byPhone.get(k);
      if (!prev) {
        byPhone.set(k, c);
        result.push(c);
      } else {
        // Merge: fill blanks on the row already kept. Outreach timestamps keep
        // the most recent of the two so a merge never loses follow-up history.
        prev.email = prev.email || c.email;
        prev.note = prev.note || c.note;
        prev.company = prev.company || c.company;
        prev.companyId = prev.companyId || c.companyId;
        for (const { key } of REACH_CHANNELS) {
          if (c[key]) prev[key] = Math.max(prev[key] || 0, c[key]);
        }
      }
    }
    return result;
  }, [companies, customContacts, contactEdits, companyName]);

  const companyOptions = useMemo(
    () => [...new Set(contacts.map((c) => c.company).filter(Boolean))].sort(),
    [contacts]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts
      .filter((c) => {
        if (q && !`${c.name} ${c.company} ${c.phone} ${c.email} ${c.note || ""}`.toLowerCase().includes(q))
          return false;
        if (companyFilter !== "all" && c.company !== companyFilter) return false;
        if (withEmail && !c.email) return false;
        if (reachFilter === "none" && lastReachedAt(c) > 0) return false;
        if (reachFilter === "any" && lastReachedAt(c) === 0) return false;
        if (reachFilter !== "all" && reachFilter !== "none" && reachFilter !== "any" && !c[reachFilter])
          return false;
        return true;
      })
      .sort((a, b) => {
        // When filtering by outreach, the oldest contact floats to the top —
        // that's who is most overdue a follow-up.
        if (reachFilter !== "all" && reachFilter !== "none") {
          return lastReachedAt(a) - lastReachedAt(b);
        }
        return (
          (a.company || "zzz").localeCompare(b.company || "zzz") ||
          (a.name || "").localeCompare(b.name || "")
        );
      });
  }, [contacts, search, companyFilter, withEmail, reachFilter]);

  const visible = filtered.slice(0, limit);
  const emailCount = contacts.filter((c) => c.email).length;
  const reachedCount = contacts.filter((c) => lastReachedAt(c) > 0).length;

  // Stamp "reached out now" on a channel, or clear it if already marked.
  const toggleReach = (c, key) => onPatchContact(c.id, { [key]: c[key] ? null : Date.now() });

  const copyAll = () => {
    const text = filtered
      .map((c) => [c.name, c.company, c.phone, c.email].filter(Boolean).join(" · "))
      .join("\n");
    copyText(text, `${filtered.length} contacts copied`);
  };

  const selectCls =
    "text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100 cursor-pointer";

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>
          <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-300">
            📇 HR &amp; Recruiter Contacts ({contacts.length})
          </h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {companyOptions.length} companies · {emailCount} with email · {reachedCount} reached out
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyAll}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
            title="Copy every contact currently listed"
          >
            <HiOutlineClipboardCopy /> Copy list
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setAdding((a) => !a);
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
          >
            <HiPlus /> Add contact
          </button>
        </div>
      </div>

      {(adding || editing) && (
        <ContactForm
          allCompanies={allCompanies}
          initial={editing}
          onSave={(data) => {
            if (editing) onEditContact(editing.id, data);
            else onAddContact(data);
          }}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      )}

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
            placeholder="Search name, company, phone, email…"
            className="w-full text-sm pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-gray-100"
          />
        </div>
        <select
          value={companyFilter}
          onChange={(e) => {
            setCompanyFilter(e.target.value);
            setLimit(PAGE_SIZE);
          }}
          className={selectCls}
        >
          <option value="all">All companies</option>
          {companyOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={reachFilter}
          onChange={(e) => {
            setReachFilter(e.target.value);
            setLimit(PAGE_SIZE);
          }}
          className={selectCls}
          title="Filter by whether you've reached out — oldest first, so overdue follow-ups surface"
        >
          <option value="all">Any outreach</option>
          <option value="none">Not reached out</option>
          <option value="any">Reached out (oldest first)</option>
          {REACH_CHANNELS.map((ch) => (
            <option key={ch.key} value={ch.key}>
              Via {ch.label}
            </option>
          ))}
        </select>
        <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={withEmail}
            onChange={(e) => setWithEmail(e.target.checked)}
            className="w-4 h-4 accent-indigo-500 cursor-pointer"
          />
          Has email
        </label>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{filtered.length} shown</span>
      </div>

      {/* Contact grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
        {visible.map((c) => (
          <ContactCard
            key={c.id}
            c={c}
            onEdit={() => {
              setAdding(false);
              setEditing(c);
            }}
            onDelete={() => onDeleteContact(c)}
            onToggleReach={toggleReach}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <div className={`${GLASS} rounded-xl p-10 text-center`}>
          <p className="text-sm text-gray-400 dark:text-gray-500">No contacts match these filters.</p>
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
