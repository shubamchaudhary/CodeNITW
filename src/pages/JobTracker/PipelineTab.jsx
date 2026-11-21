import React, { createContext, useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { HiOutlineExternalLink, HiCheck, HiX, HiPlus, HiChevronDown, HiChevronDoubleDown, HiChevronDoubleUp, HiReply, HiChatAlt } from "react-icons/hi";
import {
  APPLIED_SET,
  ERASE_AFTER_DAYS,
  ERASE_WARN_DAYS,
  StatusSelect,
  daysToErase,
  agoLabel,
  linkStage,
  needsOutreach,
  appliedTime,
  closedTime,
  dayKey,
  todayKey,
  normalizeUrl,
  putBack,
} from "./shared";
import { LIGHT_BUTTON, LIGHT_FIELD } from "../../components/glass";
import ActivityChart from "./ActivityChart";

// The pipeline: every job link moves To Apply → Asked for Referral → Applied,
// and ends in Closed (rejected, or a referral ask that never got a reply).
// Outreach sits beside them: a referral ask or an application can also carry
// "message the recruiter", which lists it there until it's done.
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
const OUTREACH_KEYS = ["outreach", "outreachAt", "outreachDoneAt"];
const withOutreach = (l, now) => ({ ...without(l, ["outreachDoneAt"]), outreach: true, outreachAt: l.outreachAt || now });

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
      return { ...without(r, ["appliedAt", "referralAt", "referralAppliedAt", "referralOutcome", "referralOutcomeAt", ...OUTREACH_KEYS]), applied: false, referral: false };
    case "referral":
      return { ...without(r, ["appliedAt", "referralAppliedAt"]), applied: false, referral: true, referralAt: r.referralAt || now };
    case "applied":
      if (hasApplied(r)) return r; // it was an application: reopened
      return r.referral ? { ...r, referralAppliedAt: now } : { ...r, applied: true, appliedAt: now };
    case "closed":
      if (hasApplied(l)) return { ...l, outcome: "rejected", outcomeAt: now };
      return l.referral ? { ...l, closedReason: "noReply", closedAt: now } : l;
    case "outreach":
      return withOutreach(l, now);
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
    case "appliedOutreach": // applied, and the recruiter is still to message
      return withOutreach({ ...l, applied: true, appliedAt: l.appliedAt || now }, now);
    case "referralOutreach": // asking for a referral and messaging the recruiter
      return withOutreach({ ...l, referral: true, referralAt: l.referralAt || now }, now);
    case "outreachDone": // messaged: leaves Outreach
      return { ...l, outreachDoneAt: now };
    case "outreachDrop": // not messaging after all
      return without(l, OUTREACH_KEYS);
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
      if (l.applied) return without({ ...l, applied: false }, ["appliedAt", ...OUTREACH_KEYS]);
      if (l.referral) return without({ ...l, referral: false }, ["referralAt", ...OUTREACH_KEYS]);
      return l;
    default:
      return l;
  }
}

// Move one or more of a company's links — a button's action, or "drop:<stage>"
// for a drag — keeping the company's own status in step: a new application
// makes it Applied (also when it was Rejected: its earlier applications stay
// closed, each marked rejected itself), and taking back its only application
// returns it to To Apply. Worked out from the company as it is when the
// change lands (patchCompany hands it in), not as the page last drew it, so a
// sync that arrived in between isn't written over.
function makeMover(patchCompany) {
  return (companyId, linkIds, to) => {
    const ids = new Set([].concat(linkIds));
    const now = Date.now(); // outside the update, which may run twice
    const drop = to.startsWith("drop:") ? to.slice(5) : null;
    patchCompany(companyId, (entry) => {
      const status = entry.status || "none";
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
      return { ...patch, links };
    });
  };
}

// A company that was only "To Apply" because of its links isn't, once the
// last one is gone.
const settled = (entry, links) => ({ links, ...(!links.length && entry.status === "toApply" ? { status: "none" } : {}) });

// Undo for settled(): the links go back (see putBack), and so does "To
// Apply" if taking them out had cleared it.
const unsettled = (entry, before, gone, status) => ({
  links: putBack(entry.links || [], before, gone),
  ...(status === "toApply" && (entry.status || "none") === "none" ? { status } : {}),
});

// Take one job out: only the link with this id. Undo puts that one back where
// it was, and leaves everything done since (another job removed, moved or
// added) as it is.
// The removed job's link is also dismissed, so Openings never offers it again.
function makeRemove(entryOf, patchCompany, dismissUrls) {
  return (companyId, linkId) => {
    const entry = entryOf(companyId);
    const before = entry.links || [];
    const removed = before.find((l) => l.id === linkId);
    if (!removed) return;
    patchCompany(companyId, (e) => settled(e, (e.links || []).filter((l) => l.id !== linkId)));
    dismissUrls?.([removed.url]);
    toast.info(
      ({ closeToast }) => (
        <span className="text-sm">
          Removed <span className="font-semibold">{(removed.label || "opening").slice(0, 40)}</span>{" "}
          <button
            onClick={() => {
              patchCompany(companyId, (e) => unsettled(e, before, [removed], entry.status));
              dismissUrls?.([removed.url], false);
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
  "bg-canvas border border-line     ";
// The two cards peeking out behind the top one: each a step dimmer.
const BEHIND_1 = "bg-surface-subtle border border-line   ";
const BEHIND_2 = "bg-surface-hover border border-line   ";

const TONES = {
  toApply: {
    title: "text-fg",
    dot: "bg-warning-fg",
    pill: "bg-warning-subtle text-warning-fg      ",
    add: "bg-warning-fg hover:bg-surface-hover",
  },
  referral: {
    title: "text-fg",
    dot: "bg-brand",
    pill: "bg-brand-subtle text-brand-fg      ",
    add: "bg-brand hover:bg-primary-hover",
  },
  applied: {
    title: "text-fg",
    dot: "bg-success",
    pill: "bg-success-subtle text-success-fg      ",
    add: "bg-success hover:opacity-90",
  },
  outreach: {
    title: "text-fg",
    dot: "bg-accent",
    pill: "bg-accent-subtle text-accent-fg",
  },
  closed: {
    title: "text-fg-subtle ",
    dot: "bg-fg-subtle",
    pill: "bg-surface-hover text-fg-muted       ",
  },
};

const BTN = {
  emerald: "bg-success hover:opacity-90 text-white",
  violet: "bg-primary hover:bg-primary-hover text-on-primary",
  violetLine: "border border-line-strong text-brand-fg hover:bg-surface-hover  ",
  grayLine: "border border-line-strong text-fg-muted hover:bg-surface-hover  ",
  roseLine: "border border-line text-danger-fg hover:bg-surface-hover  ",
};

// True inside the card on top of a stack: the one being worked on, drawn
// bigger, with bigger buttons.
const Featured = createContext(false);

// ── One click, one job ──────────────────────────────────────────────────────
// Acting on a job (remove, Applied, Rejected, …) takes its row out, and the
// row below slides up into its place — the next card's, when it was the
// card's last job. So the second click of a double-click, or of a quick
// repeat, landed on the next job's same button and acted on it too. A click
// the browser counts as a repeat (detail > 1), or one within REPEAT_MS of the
// last job action, is ignored.
const REPEAT_MS = 350;
let lastActionAt = 0;
const oneJob = (fn) =>
  fn &&
  ((e) => {
    const now = Date.now();
    if (e?.detail > 1 || now - lastActionAt < REPEAT_MS) return;
    lastActionAt = now;
    fn(e);
  });

// A button, or with `href` a link that looks like one (opens in a new tab).
// `square` makes it icon-sized.
function Btn({ kind, onClick, href, title, square, children }) {
  const big = useContext(Featured);
  const size = square ? (big ? "p-1.5" : "p-1") : big ? "text-xs px-3 py-1.5" : "text-[11px] px-2 py-1";
  const cls = `inline-flex items-center gap-1 font-semibold rounded-lg transition-colors ${size} ${BTN[kind]}`;
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" draggable={false} title={title} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button onClick={oneJob(onClick)} title={title} className={cls}>
      {children}
    </button>
  );
}

// ── Stack ───────────────────────────────────────────────────────────────────
// Collapsed: the first card, with the edges of the next two peeking out below
// it like a deck. "Show all" deals the rest out underneath. Acting on the top
// card sends it off and the next one rises into place. The top card is drawn
// bigger (each item's node(featured)), the one to work on.
function Stack({ items, empty }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-xs text-fg-subtle">
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
        {!open && behind > 1 && <div aria-hidden className={`absolute inset-x-6 bottom-0 h-12 rounded-lg ${BEHIND_2}`} />}
        {!open && behind > 0 && (
          <div aria-hidden className={`absolute inset-x-3 ${behind > 1 ? "bottom-2.5" : "bottom-0"} h-12 rounded-lg ${BEHIND_1}`} />
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
                {it.node(i === 0)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      {behind > 0 && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold text-fg-subtle hover:text-fg hover:bg-surface-hover transition-colors"
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
function JobCard({ company, aside, children, drag, dimmed, featured }) {
  return (
    <Featured.Provider value={!!featured}>
    <div
      {...drag}
      className={`${CARD} rounded-lg ${featured ? "p-5 shadow-lg ring-1 ring-line-strong" : "p-3.5"} ${drag ? "cursor-grab active:cursor-grabbing" : ""} ${dimmed ? "opacity-40" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`font-semibold text-fg ${featured ? "text-lg" : ""}`}>{company.name}</span>
            {company.pay && <span className="text-[11px] font-semibold text-fg-subtle">₹{company.pay} LPA</span>}
            {company.careers && (
              <a href={company.careers} target="_blank" rel="noreferrer" draggable={false} className="text-accent-fg hover:text-fg" title="Careers page">
                <HiOutlineExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          {company.location && <p className="text-[11px] text-fg-subtle">{company.location}</p>}
        </div>
        {aside}
      </div>
      <ul className={featured ? "mt-4 space-y-4" : "mt-2.5 space-y-2.5"}>{children}</ul>
    </div>
    </Featured.Provider>
  );
}

// A job from the Naukri job finder: which Naukri account to apply from.
const NAUKRI_ACCOUNT = { backend: "Backend", ai: "AI" };
function AccountTag({ link }) {
  const name = NAUKRI_ACCOUNT[link.naukriAccount];
  if (!name) return null;
  return (
    <span
      title={`From the Naukri job finder's ${name} list: apply from your ${name} Naukri account`}
      className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-hover text-fg-muted"
    >
      Naukri · {name}
    </span>
  );
}

function Row({ link, icon, iconCls, linkCls = "text-fg ", meta, metaCls, onBack, backTitle, onRemove, drag, children }) {
  const big = useContext(Featured);
  return (
    <li {...drag}>
      <div className={`flex items-center gap-1.5 min-w-0 ${big ? "text-[15px]" : "text-sm"}`}>
        <span className={`shrink-0 w-4 text-center ${iconCls}`}>{icon}</span>
        <a href={link.url} target="_blank" rel="noreferrer" title={link.url} draggable={false} className={`truncate font-medium hover:underline ${linkCls}`}>
          {link.label}
        </a>
        <HiOutlineExternalLink className="w-3 h-3 text-fg-subtle shrink-0" />
        <AccountTag link={link} />
        {onBack && (
          <button onClick={oneJob(onBack)} title={backTitle} className="shrink-0 text-fg-subtle hover:text-fg-muted">
            <HiReply className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={oneJob(onRemove)} title="Remove from pipeline" className="shrink-0 text-fg-subtle hover:text-fg">
          <HiX className="w-3.5 h-3.5" />
        </button>
        {meta && <span className={`ml-auto pl-2 shrink-0 text-[11px] font-medium ${metaCls || "text-fg-subtle "}`}>{meta}</span>}
      </div>
      {children && <div className={`${big ? "mt-2.5 gap-2" : "mt-1.5 gap-1.5"} pl-5 flex flex-wrap items-center`}>{children}</div>}
    </li>
  );
}

const Tag = ({ cls, children }) => <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cls}`}>{children}</span>;

// ── Compact list ────────────────────────────────────────────────────────────
// Applied, kept small: one line per job, the first COMPACT_SHOWN of them.
const COMPACT_SHOWN = 6;

function CompactList({ items, empty }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong px-4 py-4 text-center text-xs text-fg-subtle">{empty}</div>
    );
  }
  const shown = open ? items : items.slice(0, COMPACT_SHOWN);
  return (
    <div>
      <ul className={`${CARD} rounded-lg divide-y divide-line overflow-hidden`}>
        {shown.map((it) => (
          <li key={it.key}>{it.node}</li>
        ))}
      </ul>
      {items.length > COMPACT_SHOWN && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold text-fg-subtle hover:text-fg hover:bg-surface-hover transition-colors"
        >
          {open ? "Show less" : `Show all ${items.length}`}
          <HiChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}

// One job on one line: company, role, when, and small controls.
function CompactRow({ company, link, meta, tags, drag, dimmed, controls }) {
  return (
    <div {...drag} className={`px-3 py-2 text-xs min-w-0 ${drag ? "cursor-grab active:cursor-grabbing" : ""} ${dimmed ? "opacity-40" : ""}`}>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="shrink-0 font-semibold text-fg max-w-[50%] truncate" title={company.name}>
          {company.name}
        </span>
        <a href={link.url} target="_blank" rel="noreferrer" title={link.url} draggable={false} className="truncate text-fg-muted hover:underline">
          {link.label}
        </a>
        <AccountTag link={link} />
        <span className="ml-auto pl-1 shrink-0 text-[10px] text-fg-subtle">{meta}</span>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        {tags}
        <span className="ml-auto" />
        {controls}
      </div>
    </div>
  );
}

const IconBtn = ({ onClick, title, cls = "text-fg-subtle hover:text-fg", children }) => (
  <button onClick={oneJob(onClick)} title={title} className={`shrink-0 ${cls}`}>
    {children}
  </button>
);

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
    `w-full text-sm px-2.5 py-1.5 rounded-lg border border-line-strong bg-canvas placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-focus ${LIGHT_FIELD}`;
  const listId = `pipeline-companies-${stage}`;
  return (
    <div className={`${CARD} rounded-lg p-3 mb-3 space-y-2`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-fg-muted">{ADD_TITLE[stage]}</span>
        <button onClick={onClose} className="text-fg-subtle hover:text-fg" title="Close">
          <HiX />
        </button>
      </div>
      <input list={listId} value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={keys} placeholder="Company" className={input} autoFocus />
      <datalist id={listId}>
        {allCompanies.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>
      {isNew && <p className="text-[11px] text-fg-subtle -mt-1">New company: it'll be added to your list too.</p>}
      <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={keys} placeholder="Job link (https://…)" className={input} />
      <input value={role} onChange={(e) => setRole(e.target.value)} onKeyDown={keys} placeholder="Role (optional, e.g. SDE-2 Backend)" className={input} />
      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={!ready}
          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-on-primary disabled:opacity-40 disabled:cursor-not-allowed"
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
      ? "outline outline-2 outline-dashed outline-offset-[6px] outline-focus bg-accent-subtle"
      : dropState === "ready"
      ? "outline outline-2 outline-dashed outline-offset-[6px] outline-line-strong"
      : "";
  return (
    <section {...drop} className={`min-w-0 rounded-lg transition-colors ${outline}`}>
      <div className="flex items-center gap-2 mb-1">
        {/* Light mode titles the section in ink with a coloured status dot,
            the way Linear heads a board column; dark keeps coloured titles. */}
        <span aria-hidden className={`hidden w-2 h-2 rounded-full ${t.dot}`} />
        <h2 className={`text-lg font-semibold ${t.title}   `}>{title}</h2>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.pill}`}>{count}</span>
        {onAdd && (
          <button onClick={onAdd} className={`ml-auto inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg text-white ${t.add} ${LIGHT_BUTTON} `}>
            <HiPlus className="w-3 h-3" /> Add
          </button>
        )}
      </div>
      <p className="text-xs text-fg-subtle mb-3">{hint}</p>
      {children}
    </section>
  );
}

// ── Pipeline ────────────────────────────────────────────────────────────────
const STAGE_TIME = {
  outreach: (l) => l.outreachAt,
  toApply: (l) => l.addedAt,
  referral: (l) => l.referralAt,
  applied: appliedTime,
  closed: closedTime,
};

export default function PipelineTab({ allCompanies, entryOf, patchCompany, addJob, dismissUrls, ledger }) {
  const move = makeMover(patchCompany);
  const removeLink = makeRemove(entryOf, patchCompany, dismissUrls);
  const [adding, setAdding] = useState(null); // the section whose Add form is open
  // What's being dragged, { from, companyId, linkIds }: in a ref for the drop
  // logic (set at once), and in state for the highlighting (set a tick later).
  const dragRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null); // the section it's over

  // One card per company per section, holding that company's links in it.
  const groups = { toApply: [], referral: [], applied: [], closed: [], outreach: [] };
  allCompanies.forEach((company) => {
    const entry = entryOf(company.id);
    const links = entry.links || [];
    const by = { toApply: [], referral: [], applied: [], closed: [] };
    links.forEach((l) => by[linkStage(l, entry)].push(l));
    by.outreach = links.filter((l) => needsOutreach(l, entry));
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
  // To Apply: a company moved to the end ("Later") stays below the rest until
  // the day turns (4am IST); the last one moved goes last.
  const today = todayKey();
  const laterAt = (g) => (g.entry.laterAt && dayKey(g.entry.laterAt) === today ? g.entry.laterAt : 0);
  groups.toApply.sort((a, b) => (laterAt(a) && laterAt(b) ? laterAt(a) - laterAt(b) : !!laterAt(a) - !!laterAt(b)));
  const count = (stage) => groups[stage].reduce((n, g) => n + g.links.length, 0);

  const clearClosed = () => {
    // Exactly the closed jobs shown, so Undo puts back just those.
    const plans = groups.closed.map((g) => ({ id: g.company.id, before: g.entry.links || [], gone: g.links, status: g.entry.status }));
    const n = count("closed");
    plans.forEach((p) => {
      const gone = new Set(p.gone.map((l) => l.id));
      patchCompany(p.id, (e) => settled(e, (e.links || []).filter((l) => !gone.has(l.id))));
    });
    toast.info(
      ({ closeToast }) => (
        <span className="text-sm">
          Cleared {n} closed{" "}
          <button
            onClick={() => {
              plans.forEach((p) => patchCompany(p.id, (e) => unsettled(e, p.before, p.gone, p.status)));
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
      metaCls: soon ? "text-warning-fg " : cls,
    };
  };
  const mv = (g, l, to) => () => move(g.company.id, l.id, to);

  // ── Drag and drop ──
  // A card carries all its jobs in that section; a row just its own. Closed
  // takes only applications (→ Rejected) and referral asks (→ No reply).
  // Outreach takes them too (→ message the recruiter).
  const canDrop = (d, stage) =>
    !!d && d.from !== stage && (!["closed", "outreach"].includes(stage) || d.from === "referral" || d.from === "applied");
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
    node: (featured) => (
      <JobCard
        company={g.company}
        featured={featured}
        {...cardDrag("toApply", g)}
        aside={
          laterAt(g) ? (
            <button
              onClick={oneJob(() => patchCompany(g.company.id, { laterAt: null }))}
              title="Moved to the end for today. Bring it back into place"
              className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-line text-fg-muted hover:bg-surface-hover"
            >
              <HiChevronDoubleUp className="w-3 h-3" /> Later · undo
            </button>
          ) : (
            <button
              onClick={oneJob(() => patchCompany(g.company.id, { laterAt: Date.now() }))}
              title="Move this company to the end of To Apply until tomorrow (4am IST)"
              className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-line text-fg-subtle hover:text-fg hover:bg-surface-hover"
            >
              <HiChevronDoubleDown className="w-3 h-3" /> Move to end
            </button>
          )
        }
      >
        {g.links.map((l) => {
          const added = agoLabel(l.addedAt);
          return (
            <Row key={l.id} {...rowProps("toApply", g, l, added && `added ${added}`)} icon="○" iconCls="text-warning-fg">
              <Btn kind="violet" href={l.url} title="Open the posting to apply (new tab)">
                <HiOutlineExternalLink className="w-3.5 h-3.5" /> Apply
              </Btn>
              <Btn kind="emerald" onClick={mv(g, l, "applied")} title="You applied: moves to Applied">
                <HiCheck className="w-3.5 h-3.5" /> Applied
              </Btn>
              <Btn kind="violetLine" onClick={mv(g, l, "referralOutreach")} title="Apply through a referral: moves to Asked for Referral, and to Outreach to message the recruiter">
                Referral + outreach
              </Btn>
              <Btn kind="violetLine" onClick={mv(g, l, "appliedOutreach")} title="You applied: moves to Applied, and to Outreach to message the recruiter later">
                Applied + outreach
              </Btn>
              <Btn kind="roseLine" square onClick={() => removeLink(g.company.id, l.id)} title="Not applying: remove it (Undo in the toast)">
                <HiX className="w-3.5 h-3.5" />
              </Btn>
            </Row>
          );
        })}
      </JobCard>
    ),
  }));

  const referralCards = groups.referral.map((g) => ({
    key: g.company.id,
    node: (featured) => (
      <JobCard company={g.company} featured={featured} {...cardDrag("referral", g)}>
        {g.links.map((l) => {
          const asked = agoLabel(l.referralAt);
          return (
            <Row
              key={l.id}
              {...rowProps("referral", g, l, asked && `asked ${asked}`)}
              icon="↗"
              iconCls="text-brand-fg"
              onBack={mv(g, l, "back")}
              backTitle="Move back to To Apply"
            >
              {needsOutreach(l, g.entry) && <Tag cls="bg-accent-subtle text-accent-fg">outreach</Tag>}
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

  // Outreach: one card per company, a row per job whose recruiter is still to
  // message. Not draggable: it's a to-do on top of the job's own section.
  const outreachCards = groups.outreach.map((g) => ({
    key: g.company.id,
    node: (featured) => (
      <JobCard company={g.company} featured={featured}>
        {g.links.map((l) => {
          const stage = linkStage(l, g.entry);
          const since = agoLabel(l.outreachAt);
          return (
            <Row key={l.id} link={l} icon="✉" iconCls="text-accent-fg" meta={since && `since ${since}`} onRemove={mv(g, l, "outreachDrop")}>
              <Tag cls={stage === "applied" ? "bg-success-subtle text-success-fg" : "bg-brand-subtle text-brand-fg"}>
                {stage === "applied" ? "applied" : "referral asked"}
              </Tag>
              <Btn kind="emerald" onClick={mv(g, l, "outreachDone")} title="You messaged the recruiter: leaves Outreach">
                <HiChatAlt className="w-3.5 h-3.5" /> Messaged
              </Btn>
            </Row>
          );
        })}
      </JobCard>
    ),
  }));

  // Applied, compact: today's applications only (4am–4am IST), a line per
  // job, newest company first. Earlier ones stay in the data (statuses,
  // the chart), just not listed.
  const appliedToday = (l, entry) => {
    const at = appliedTime(l, entry);
    return !!at && dayKey(at) === today;
  };
  const appliedRows = groups.applied.flatMap((g) =>
    g.links.filter((l) => appliedToday(l, g.entry)).map((l) => {
      const when = agoLabel(appliedTime(l, g.entry));
      const viaReferral = !!l.referralAppliedAt;
      return {
        key: l.id,
        node: (
          <CompactRow
            company={g.company}
            link={l}
            meta={when}
            drag={dragFrom("applied", g.company.id, [l.id])}
            dimmed={drag?.from === "applied" && drag.linkIds.includes(l.id)}
            tags={
              <>
                {viaReferral && <Tag cls="bg-brand-subtle text-brand-fg">ref</Tag>}
                {needsOutreach(l, g.entry) && <Tag cls="bg-accent-subtle text-accent-fg">outreach</Tag>}
              </>
            }
            controls={
              <>
                <StatusSelect small value={g.entry.status} onChange={(v) => patchCompany(g.company.id, { status: v })} />
                <IconBtn onClick={mv(g, l, "back")} title={viaReferral ? "Move back to Asked for Referral" : "Move back to To Apply"}>
                  <HiReply className="w-3.5 h-3.5" />
                </IconBtn>
                <IconBtn onClick={mv(g, l, "rejected")} title="Rejected: move it to Closed" cls="text-danger-fg hover:opacity-80 font-semibold text-[10px]">
                  Rejected
                </IconBtn>
                <IconBtn onClick={() => removeLink(g.company.id, l.id)} title="Remove from pipeline">
                  <HiX className="w-3.5 h-3.5" />
                </IconBtn>
              </>
            }
          />
        ),
      };
    })
  );

  const closedCards = groups.closed.map((g) => ({
    key: g.company.id,
    node: (featured) => (
      <JobCard company={g.company} featured={featured} {...cardDrag("closed", g)}>
        {g.links.map((l) => {
          const when = agoLabel(closedTime(l));
          const reason = l.closedReason === "noReply" ? "No reply" : "Rejected";
          return (
            <Row
              key={l.id}
              {...rowProps("closed", g, l, when ? `${reason} · ${when}` : reason, reason === "Rejected" ? "text-danger-fg " : undefined)}
              icon="•"
              iconCls="text-fg-subtle"
              linkCls="text-fg-subtle "
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
      <p className="mb-4 text-xs text-fg-subtle">
        Drag a card (or one job in it) to another section to move it. A job left untouched for {ERASE_AFTER_DAYS} days is erased
        automatically; live applications (OA, Interview, Offer) stay.
      </p>
      <div className="grid gap-6 items-start lg:grid-cols-2 2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Section stage="toApply" title="To Apply" count={count("toApply")} hint="Applied, applying through a referral (+ recruiter outreach), or applied + outreach." onAdd={toggleAdd("toApply")} drop={dropOn("toApply")} dropState={dropState("toApply")}>
          {addForm("toApply")}
          <Stack items={toApplyCards} empty="Nothing to apply to yet. Add a job link, or Add all in Openings." />
        </Section>

        <Section stage="referral" title="Asked for Referral" count={count("referral")} hint="Waiting on a referral. Mark Applied once you apply with it." onAdd={toggleAdd("referral")} drop={dropOn("referral")} dropState={dropState("referral")}>
          {addForm("referral")}
          <Stack items={referralCards} empty="No referral asks waiting." />
        </Section>

        <Section stage="outreach" title="Outreach" count={count("outreach")} hint="Recruiters to message about these jobs. Mark Messaged once you have written." drop={dropOn("outreach")} dropState={dropState("outreach")}>
          <Stack items={outreachCards} empty="No recruiters to message. Drop a referral ask or an application here to add one." />
        </Section>

        <div className="space-y-8 min-w-0">
          <Section stage="applied" title="Applied today" count={appliedRows.length} hint="Applied since 4am IST. Earlier days are in the chart below." onAdd={toggleAdd("applied")} drop={dropOn("applied")} dropState={dropState("applied")}>
            {addForm("applied")}
            <CompactList items={appliedRows} empty="Nothing applied today yet." />
          </Section>

          {/* Shown when it has cards, or as a drop zone while an application
              or referral ask is being dragged. */}
          {(closedCards.length > 0 || canDrop(drag, "closed")) && (
            <Section stage="closed" title="Closed" count={count("closed")} hint="Rejected or no reply. Out of the way until it's erased." drop={dropOn("closed")} dropState={dropState("closed")}>
              <Stack items={closedCards} empty="Drop here to mark it rejected (or no reply)." />
              {closedCards.length > 0 && (
                <button onClick={clearClosed} className="mt-1 text-xs font-semibold text-fg-subtle hover:text-fg">
                  Clear all closed
                </button>
              )}
            </Section>
          )}
        </div>
      </div>
      <ActivityChart ledger={ledger} />
    </div>
  );
}
