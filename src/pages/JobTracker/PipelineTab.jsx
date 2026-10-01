import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { HiOutlineExternalLink, HiCheck, HiX, HiPlus, HiChevronDown, HiReply } from "react-icons/hi";
import {
  APPLIED_SET,
  ERASE_AFTER_DAYS,
  ERASE_WARN_DAYS,
  StatusSelect,
  daysToErase,
  agoLabel,
  linkStage,
  appliedTime,
  closedTime,
  normalizeUrl,
} from "./shared";

// The pipeline: every job link moves To Apply → Asked for Referral → Applied,
// and ends in Closed (rejected, or a referral ask that never got a reply).
// Each section is a stack — the newest company on top, the rest peeking out
// behind it — that deals out into a full list on "Show all". A link left
// untouched for ERASE_AFTER_DAYS is erased (JobTracker runs it; the rules are
// in shared.jsx); its last week, the card counts down. On a desktop, a card
// (or one job in it) can be dragged to another section instead of clicking.

// ── Moving a link between stages ────────────────────────────────────────────
const without = (obj, keys) => {
  const copy = { ...obj };
  keys.forEach((k) => delete copy[k]);
  return copy;
};

const hasApplied = (l) => !!(l.applied || l.referralAppliedAt);

// A closed link with its closing taken off: back where it was.
function reopened(l) {
  const keys = ["outcome", "outcomeAt", "closedReason", "closedAt"];
  if (l.referralOutcome === "rejected") keys.push("referralOutcome", "referralOutcomeAt");
  return without(l, keys);
}

// A link dragged into `stage`, from wherever it was.
function dropLink(l, stage, now) {
  const r = reopened(l);
  switch (stage) {
    case "toApply":
      return { ...without(r, ["appliedAt", "referralAt", "referralAppliedAt", "referralOutcome", "referralOutcomeAt"]), applied: false, referral: false };
    case "referral":
      return { ...without(r, ["appliedAt", "referralAppliedAt"]), applied: false, referral: true, referralAt: r.referralAt || now };
    case "applied":
      if (hasApplied(r)) return r; // it was an application: reopened
      return r.referral ? { ...r, referralAppliedAt: now } : { ...r, applied: true, appliedAt: now };
    case "closed":
      if (hasApplied(l)) return { ...l, outcome: "rejected", outcomeAt: now };
      return l.referral ? { ...l, closedReason: "noReply", closedAt: now } : l;
    default:
      return l;
  }
}

function moveLink(l, to, now) {
  switch (to) {
    case "applied": // applied directly
      return { ...l, applied: true, appliedAt: l.appliedAt || now };
    case "referral": // asked someone for a referral
      return { ...l, referral: true, referralAt: l.referralAt || now };
    case "appliedViaReferral":
      return { ...l, referral: true, referralAt: l.referralAt || now, referralAppliedAt: l.referralAppliedAt || now };
    case "noReply":
      return { ...l, closedReason: "noReply", closedAt: now };
    case "rejected":
      return { ...l, outcome: "rejected", outcomeAt: now };
    case "reopen":
      return reopened(l);
    case "back": // one step back, for a mis-click
      if (l.referralAppliedAt) return without(l, ["referralAppliedAt"]);
      if (l.applied) return without({ ...l, applied: false }, ["appliedAt"]);
      if (l.referral) return without({ ...l, referral: false }, ["referralAt"]);
      return l;
    default:
      return l;
  }
}

// Move one or more of a company's links — a button's action, or "drop:<stage>"
// for a drag — keeping the company's own status in step: a new application
// makes it Applied (also when it was Rejected: its earlier applications stay
// closed, each marked rejected itself), and taking back its only application
// returns it to To Apply.
function makeMover(entryOf, patchCompany) {
  return (companyId, linkIds, to) => {
    const ids = new Set([].concat(linkIds));
    const entry = entryOf(companyId);
    const status = entry.status || "none";
    const now = Date.now();
    const drop = to.startsWith("drop:") ? to.slice(5) : null;
    let applying = false;
    let unapplying = false;
    let links = (entry.links || []).map((l) => {
      if (!ids.has(l.id)) return l;
      const next = drop ? dropLink(l, drop, now) : moveLink(l, to, now);
      if (linkStage(next) === "applied" && linkStage(l, entry) !== "applied") applying = true;
      if (hasApplied(l) && !hasApplied(next)) unapplying = true;
      return { ...next, touchedAt: now }; // any move restarts the erase clock
    });
    const patch = {};
    if (applying && (!APPLIED_SET.has(status) || status === "rejected")) {
      if (status === "rejected") {
        links = links.map((l) =>
          !ids.has(l.id) && linkStage(l, entry) === "closed" && linkStage(l) === "applied" ? { ...l, outcome: "rejected", outcomeAt: now } : l
        );
      }
      patch.status = "applied";
    } else if (unapplying && status === "applied" && !links.some(hasApplied)) patch.status = "toApply";
    patchCompany(companyId, { ...patch, links });
  };
}

// A company that was only "To Apply" because of its links isn't, once the
// last one is gone.
const settled = (entry, links) => ({ links, ...(!links.length && entry.status === "toApply" ? { status: "none" } : {}) });

function makeRemove(entryOf, patchCompany) {
  return (companyId, linkId) => {
    const entry = entryOf(companyId);
    const prevLinks = entry.links || [];
    const removed = prevLinks.find((l) => l.id === linkId);
    const patch = settled(entry, prevLinks.filter((l) => l.id !== linkId));
    patchCompany(companyId, patch);
    toast.info(
      ({ closeToast }) => (
        <span className="text-sm">
          Removed <span className="font-semibold">{(removed?.label || "opening").slice(0, 40)}</span>{" "}
          <button
            onClick={() => {
              patchCompany(companyId, { links: prevLinks, ...(patch.status ? { status: entry.status } : {}) });
              closeToast();
            }}
            className="underline font-semibold"
          >
            Undo
          </button>
        </span>
      ),
      { autoClose: 4000 }
    );
  };
}

// ── Look ────────────────────────────────────────────────────────────────────
// Cards are opaque so the ones stacked behind don't show through.
const CARD =
  "bg-white dark:bg-[#121a30] border border-gray-200/90 dark:border-white/[0.09] shadow-[0_6px_18px_-10px_rgba(15,23,42,0.35)] dark:shadow-[0_8px_22px_-8px_rgba(0,0,0,0.7)]";
// The two cards peeking out behind the top one: each a step dimmer.
const BEHIND_1 = "bg-gray-50 dark:bg-[#141c33] border border-gray-200 dark:border-white/[0.09]";
const BEHIND_2 = "bg-gray-100/80 dark:bg-[#111830] border border-gray-200 dark:border-white/[0.07]";

const TONES = {
  toApply: {
    title: "text-amber-600 dark:text-amber-300",
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200",
    add: "bg-amber-500 hover:bg-amber-600",
  },
  referral: {
    title: "text-violet-600 dark:text-violet-300",
    pill: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200",
    add: "bg-violet-600 hover:bg-violet-700",
  },
  applied: {
    title: "text-emerald-600 dark:text-emerald-300",
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200",
    add: "bg-emerald-600 hover:bg-emerald-700",
  },
  closed: {
    title: "text-gray-500 dark:text-gray-400",
    pill: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300",
  },
};

const BTN = {
  emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
  violet: "bg-violet-600 hover:bg-violet-700 text-white",
  violetLine: "border border-violet-300 dark:border-violet-500/40 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-500/10",
  grayLine: "border border-gray-300 dark:border-white/20 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05]",
  roseLine: "border border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10",
};

function Btn({ kind, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${BTN[kind]}`}
    >
      {children}
    </button>
  );
}

// ── Stack ───────────────────────────────────────────────────────────────────
// Collapsed: the first card, with the edges of the next two peeking out below
// it like a deck. "Show all" deals the rest out underneath. Acting on the top
// card sends it off and the next one rises into place.
function Stack({ items, empty }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-white/10 px-4 py-6 text-center text-xs text-gray-400 dark:text-gray-500">
        {empty}
      </div>
    );
  }
  const behind = items.length - 1;
  const shown = open ? items : items.slice(0, 1);
  const enter = open ? { opacity: 0, y: -24, scale: 0.97 } : { opacity: 0, y: 14, scale: 0.96 };
  return (
    <div>
      <div className={`relative ${open || !behind ? "" : behind > 1 ? "pb-5" : "pb-2.5"}`}>
        {!open && behind > 1 && <div aria-hidden className={`absolute inset-x-6 bottom-0 h-12 rounded-xl ${BEHIND_2}`} />}
        {!open && behind > 0 && (
          <div aria-hidden className={`absolute inset-x-3 ${behind > 1 ? "bottom-2.5" : "bottom-0"} h-12 rounded-xl ${BEHIND_1}`} />
        )}
        <div className="relative space-y-3">
          <AnimatePresence initial={false} mode="popLayout">
            {shown.map((it, i) => (
              <motion.div
                key={it.key}
                layout="position"
                initial={enter}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.24, delay: open ? Math.min(i, 10) * 0.035 : 0 } }}
                exit={{ opacity: 0, y: -16, scale: 0.97, transition: { duration: 0.15 } }}
              >
                {it.node}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      {behind > 0 && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100/70 dark:hover:bg-white/[0.04] transition-colors"
        >
          {open ? "Show less" : `Show all ${items.length}`}
          <HiChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}

// ── Cards and rows ──────────────────────────────────────────────────────────
// `drag`: the props that make it draggable (see dragFrom); `dimmed` while it's
// the one being dragged.
function JobCard({ company, aside, children, drag, dimmed }) {
  return (
    <div {...drag} className={`${CARD} rounded-xl p-3.5 ${drag ? "cursor-grab active:cursor-grabbing" : ""} ${dimmed ? "opacity-40" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-gray-800 dark:text-gray-100">{company.name}</span>
            {company.pay && <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">₹{company.pay} LPA</span>}
            {company.careers && (
              <a href={company.careers} target="_blank" rel="noreferrer" draggable={false} className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400" title="Careers page">
                <HiOutlineExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          {company.location && <p className="text-[11px] text-gray-400 dark:text-gray-500">{company.location}</p>}
        </div>
        {aside}
      </div>
      <ul className="mt-2.5 space-y-2.5">{children}</ul>
    </div>
  );
}

function Row({ link, icon, iconCls, linkCls = "text-gray-800 dark:text-gray-100", meta, metaCls, onBack, backTitle, onRemove, drag, children }) {
  return (
    <li {...drag}>
      <div className="flex items-center gap-1.5 text-sm min-w-0">
        <span className={`shrink-0 w-4 text-center ${iconCls}`}>{icon}</span>
        <a href={link.url} target="_blank" rel="noreferrer" title={link.url} draggable={false} className={`truncate font-medium hover:underline ${linkCls}`}>
          {link.label}
        </a>
        <HiOutlineExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
        {onBack && (
          <button onClick={onBack} title={backTitle} className="shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <HiReply className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={onRemove} title="Remove from pipeline" className="shrink-0 text-gray-400 hover:text-red-500">
          <HiX className="w-3.5 h-3.5" />
        </button>
        {meta && <span className={`ml-auto pl-2 shrink-0 text-[11px] font-medium ${metaCls || "text-gray-400 dark:text-gray-500"}`}>{meta}</span>}
      </div>
      {children && <div className="mt-1.5 pl-5 flex flex-wrap items-center gap-1.5">{children}</div>}
    </li>
  );
}

const Tag = ({ cls, children }) => <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cls}`}>{children}</span>;

// ── Add form ────────────────────────────────────────────────────────────────
// A job link straight into a section. The company is matched by name; a name
// that isn't in the list becomes a company of your own.
const ADD_TITLE = { toApply: "Add a job to apply to", referral: "Add a referral you asked for", applied: "Add a job you applied to" };

function AddJobForm({ stage, allCompanies, onAdd, onClose }) {
  const [company, setCompany] = useState("");
  const [url, setUrl] = useState("");
  const [role, setRole] = useState("");
  const name = company.trim();
  const ready = name && url.trim();
  const isNew = name && !allCompanies.some((c) => c.name.toLowerCase() === name.toLowerCase());
  const submit = () => {
    if (ready && onAdd({ companyName: name, url: normalizeUrl(url), role: role.trim(), stage })) onClose();
  };
  const keys = (e) => {
    if (e.key === "Enter") submit();
    if (e.key === "Escape") onClose();
  };
  const input =
    "w-full text-sm px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40";
  const listId = `pipeline-companies-${stage}`;
  return (
    <div className={`${CARD} rounded-xl p-3 mb-3 space-y-2`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{ADD_TITLE[stage]}</span>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500" title="Close">
          <HiX />
        </button>
      </div>
      <input list={listId} value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={keys} placeholder="Company" className={input} autoFocus />
      <datalist id={listId}>
        {allCompanies.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>
      {isNew && <p className="text-[11px] text-gray-400 dark:text-gray-500 -mt-1">New company: it'll be added to your list too.</p>}
      <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={keys} placeholder="Job link (https://…)" className={input} />
      <input value={role} onChange={(e) => setRole(e.target.value)} onKeyDown={keys} placeholder="Role (optional, e.g. SDE-2 Backend)" className={input} />
      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={!ready}
          className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <HiPlus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
    </div>
  );
}

// `drop`: drop-zone handlers; `dropState`: "ready" while a card that can land
// here is being dragged, "over" while it's over this section.
function Section({ stage, title, count, hint, onAdd, drop, dropState, children }) {
  const t = TONES[stage];
  const outline =
    dropState === "over"
      ? "outline outline-2 outline-dashed outline-offset-[6px] outline-indigo-400 bg-indigo-500/5"
      : dropState === "ready"
      ? "outline outline-2 outline-dashed outline-offset-[6px] outline-indigo-400/40"
      : "";
  return (
    <section {...drop} className={`min-w-0 rounded-2xl transition-colors ${outline}`}>
      <div className="flex items-center gap-2 mb-1">
        <h2 className={`text-lg font-bold ${t.title}`}>{title}</h2>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.pill}`}>{count}</span>
        {onAdd && (
          <button onClick={onAdd} className={`ml-auto inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg text-white shadow-sm ${t.add}`}>
            <HiPlus className="w-3 h-3" /> Add
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{hint}</p>
      {children}
    </section>
  );
}

// ── Pipeline ────────────────────────────────────────────────────────────────
const STAGE_TIME = {
  toApply: (l) => l.addedAt,
  referral: (l) => l.referralAt,
  applied: appliedTime,
  closed: closedTime,
};

export default function PipelineTab({ allCompanies, entryOf, patchCompany, addJob }) {
  const move = makeMover(entryOf, patchCompany);
  const removeLink = makeRemove(entryOf, patchCompany);
  const [adding, setAdding] = useState(null); // the section whose Add form is open
  // What's being dragged, { from, companyId, linkIds }: in a ref for the drop
  // logic (set at once), and in state for the highlighting (set a tick later).
  const dragRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null); // the section it's over

  // One card per company per section, holding that company's links in it.
  const groups = { toApply: [], referral: [], applied: [], closed: [] };
  allCompanies.forEach((company) => {
    const entry = entryOf(company.id);
    const links = entry.links || [];
    const by = { toApply: [], referral: [], applied: [], closed: [] };
    links.forEach((l) => by[linkStage(l, entry)].push(l));
    // Only job links make cards: a company marked "To Apply" in Companies
    // without one isn't something to act on here.
    Object.keys(by).forEach((stage) => {
      if (by[stage].length) groups[stage].push({ company, entry, links: by[stage] });
    });
  });
  // Newest first (entered its section, or last moved), so the top of each
  // stack is what you touched last.
  Object.entries(groups).forEach(([stage, list]) => {
    const newest = (g) => Math.max(0, ...g.links.map((l) => Math.max(STAGE_TIME[stage](l, g.entry) || 0, l.touchedAt || 0)));
    list.sort((a, b) => newest(b) - newest(a));
  });
  const count = (stage) => groups[stage].reduce((n, g) => n + g.links.length, 0);

  const clearClosed = () => {
    // What each company held before, so Undo puts back exactly that.
    const plans = groups.closed.map((g) => {
      const entry = entryOf(g.company.id);
      const links = entry.links || [];
      return { id: g.company.id, links, status: entry.status, patch: settled(entry, links.filter((l) => linkStage(l, entry) !== "closed")) };
    });
    const n = count("closed");
    plans.forEach((p) => patchCompany(p.id, p.patch));
    toast.info(
      ({ closeToast }) => (
        <span className="text-sm">
          Cleared {n} closed{" "}
          <button
            onClick={() => {
              plans.forEach((p) => patchCompany(p.id, { links: p.links, ...(p.patch.status ? { status: p.status } : {}) }));
              closeToast();
            }}
            className="underline font-semibold"
          >
            Undo
          </button>
        </span>
      ),
      { autoClose: 5000 }
    );
  };

  const addForm = (stage) =>
    adding === stage && <AddJobForm stage={stage} allCompanies={allCompanies} onAdd={addJob} onClose={() => setAdding(null)} />;
  const toggleAdd = (stage) => () => setAdding((s) => (s === stage ? null : stage));
  // A row's date, plus a countdown in its last week before it's erased.
  const rowProps = (stage, g, l, label, cls) => {
    const left = daysToErase(l, g.entry);
    const soon = label && left !== null && left <= ERASE_WARN_DAYS;
    return {
      link: l,
      drag: dragFrom(stage, g.company.id, [l.id]),
      onRemove: () => removeLink(g.company.id, l.id),
      // Past due only while this session's sync hasn't caught up yet.
      meta: soon ? `${label} · ${left > 0 ? `erased in ${left}d` : "erased soon"}` : label,
      metaCls: soon ? "text-amber-600 dark:text-amber-300" : cls,
    };
  };
  const mv = (g, l, to) => () => move(g.company.id, l.id, to);

  // ── Drag and drop ──
  // A card carries all its jobs in that section; a row just its own. Closed
  // takes only applications (→ Rejected) and referral asks (→ No reply).
  const canDrop = (d, stage) => !!d && d.from !== stage && (stage !== "closed" || d.from === "referral" || d.from === "applied");
  const endDrag = () => {
    dragRef.current = null;
    setDrag(null);
    setOver(null);
  };
  const dragFrom = (from, companyId, linkIds) => ({
    draggable: true,
    onDragStart: (e) => {
      e.stopPropagation(); // a row inside a card drags alone
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", companyId); // some browsers only start a drag with data
      const payload = { from, companyId, linkIds };
      dragRef.current = payload;
      // The highlighting waits a tick: changing the page during dragstart can cancel the drag.
      setTimeout(() => dragRef.current === payload && setDrag(payload), 0);
    },
    onDragEnd: endDrag,
  });
  const dropOn = (stage) => ({
    onDragOver: (e) => {
      if (!canDrop(dragRef.current, stage)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (over !== stage) setOver(stage);
    },
    onDragLeave: (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setOver((o) => (o === stage ? null : o));
    },
    onDrop: (e) => {
      const d = dragRef.current;
      if (!canDrop(d, stage)) return;
      e.preventDefault();
      move(d.companyId, d.linkIds, `drop:${stage}`);
      endDrag();
    },
  });
  const dropState = (stage) => (canDrop(drag, stage) ? (over === stage ? "over" : "ready") : null);
  const cardDrag = (stage, g) => ({
    drag: dragFrom(stage, g.company.id, g.links.map((l) => l.id)),
    dimmed: drag?.from === stage && drag.companyId === g.company.id,
  });

  const toApplyCards = groups.toApply.map((g) => ({
    key: g.company.id,
    node: (
      <JobCard company={g.company} {...cardDrag("toApply", g)}>
        {g.links.map((l) => {
          const added = agoLabel(l.addedAt);
          return (
            <Row key={l.id} {...rowProps("toApply", g, l, added && `added ${added}`)} icon="○" iconCls="text-amber-500">
              <Btn kind="emerald" onClick={mv(g, l, "applied")} title="You applied directly">
                <HiCheck className="w-3.5 h-3.5" /> Applied
              </Btn>
              <Btn kind="violetLine" onClick={mv(g, l, "referral")} title="You asked someone for a referral">
                Asked referral
              </Btn>
              <Btn kind="violetLine" onClick={mv(g, l, "appliedViaReferral")} title="You got a referral and applied with it">
                Applied via referral
              </Btn>
            </Row>
          );
        })}
      </JobCard>
    ),
  }));

  const referralCards = groups.referral.map((g) => ({
    key: g.company.id,
    node: (
      <JobCard company={g.company} {...cardDrag("referral", g)}>
        {g.links.map((l) => {
          const asked = agoLabel(l.referralAt);
          return (
            <Row
              key={l.id}
              {...rowProps("referral", g, l, asked && `asked ${asked}`)}
              icon="↗"
              iconCls="text-violet-500"
              onBack={mv(g, l, "back")}
              backTitle="Move back to To Apply"
            >
              <Btn kind="violet" onClick={mv(g, l, "appliedViaReferral")} title="You applied with this referral">
                <HiCheck className="w-3.5 h-3.5" /> Applied
              </Btn>
              <Btn kind="grayLine" onClick={mv(g, l, "noReply")} title="No reply: move it to Closed">
                No reply
              </Btn>
            </Row>
          );
        })}
      </JobCard>
    ),
  }));

  const appliedCards = groups.applied.map((g) => ({
    key: g.company.id,
    node: (
      <JobCard
        company={g.company}
        {...cardDrag("applied", g)}
        aside={<StatusSelect value={g.entry.status} onChange={(v) => patchCompany(g.company.id, { status: v })} />}
      >
        {g.links.map((l) => {
          const when = agoLabel(appliedTime(l, g.entry));
          const viaReferral = !!l.referralAppliedAt;
          return (
            <Row
              key={l.id}
              {...rowProps("applied", g, l, when && `applied ${when}`)}
              icon="✓"
              iconCls="text-emerald-500"
              onBack={mv(g, l, "back")}
              backTitle={viaReferral ? "Move back to Asked for Referral" : "Move back to To Apply"}
            >
              {viaReferral && <Tag cls="bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">via referral</Tag>}
              {l.referralOutcome === "accepted" && <Tag cls="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">Accepted</Tag>}
              <Btn kind="roseLine" onClick={mv(g, l, "rejected")} title="Rejected: move it to Closed">
                Rejected
              </Btn>
            </Row>
          );
        })}
      </JobCard>
    ),
  }));

  const closedCards = groups.closed.map((g) => ({
    key: g.company.id,
    node: (
      <JobCard company={g.company} {...cardDrag("closed", g)}>
        {g.links.map((l) => {
          const when = agoLabel(closedTime(l));
          const reason = l.closedReason === "noReply" ? "No reply" : "Rejected";
          return (
            <Row
              key={l.id}
              {...rowProps("closed", g, l, when ? `${reason} · ${when}` : reason, reason === "Rejected" ? "text-rose-500 dark:text-rose-300" : undefined)}
              icon="•"
              iconCls="text-gray-400"
              linkCls="text-gray-500 dark:text-gray-400"
            >
              <Btn kind="grayLine" onClick={mv(g, l, "reopen")} title="Put it back where it was">
                Reopen
              </Btn>
            </Row>
          );
        })}
      </JobCard>
    ),
  }));

  return (
    <div>
      <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
        Drag a card (or one job in it) to another section to move it. A job left untouched for {ERASE_AFTER_DAYS} days is erased
        automatically; live applications (OA, Interview, Offer) stay.
      </p>
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <Section stage="toApply" title="To Apply" count={count("toApply")} hint="Jobs you plan to apply to. Mark each one when you act on it." onAdd={toggleAdd("toApply")} drop={dropOn("toApply")} dropState={dropState("toApply")}>
          {addForm("toApply")}
          <Stack items={toApplyCards} empty="Nothing to apply to yet. Add a job link." />
        </Section>

        <Section stage="referral" title="Asked for Referral" count={count("referral")} hint="Waiting on a referral. Mark Applied once you apply with it." onAdd={toggleAdd("referral")} drop={dropOn("referral")} dropState={dropState("referral")}>
          {addForm("referral")}
          <Stack items={referralCards} empty="No referral asks waiting." />
        </Section>

        <div className="space-y-8 min-w-0">
          <Section stage="applied" title="Applied" count={count("applied")} hint="Applied directly or with a referral. Set the stage as it moves." onAdd={toggleAdd("applied")} drop={dropOn("applied")} dropState={dropState("applied")}>
            {addForm("applied")}
            <Stack items={appliedCards} empty="No applications yet." />
          </Section>

          {/* Shown when it has cards, or as a drop zone while an application
              or referral ask is being dragged. */}
          {(closedCards.length > 0 || canDrop(drag, "closed")) && (
            <Section stage="closed" title="Closed" count={count("closed")} hint="Rejected or no reply. Out of the way until it's erased." drop={dropOn("closed")} dropState={dropState("closed")}>
              <Stack items={closedCards} empty="Drop here to mark it rejected (or no reply)." />
              {closedCards.length > 0 && (
                <button onClick={clearClosed} className="mt-1 text-xs font-semibold text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400">
                  Clear all closed
                </button>
              )}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
