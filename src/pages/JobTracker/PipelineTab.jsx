import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { HiOutlineExternalLink, HiCheck, HiX, HiPlus, HiChevronDown, HiReply } from "react-icons/hi";
import {
  APPLIED_SET,
  STALE_ASK_DAYS,
  StatusSelect,
  daysSince,
  agoLabel,
  linkStage,
  appliedTime,
  closedTime,
  normalizeUrl,
} from "./shared";

// The pipeline: every job link moves To Apply → Asked for Referral → Applied,
// and ends in Closed (rejected, or a referral ask that never got a reply).
// Each section is a stack — the newest company on top, the rest peeking out
// behind it — that deals out into a full list on "Show all".

// ── Moving a link between stages ────────────────────────────────────────────
const without = (obj, keys) => {
  const copy = { ...obj };
  keys.forEach((k) => delete copy[k]);
  return copy;
};

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
    case "reopen": {
      const keys = ["outcome", "outcomeAt", "closedReason", "closedAt"];
      if (l.referralOutcome === "rejected") keys.push("referralOutcome", "referralOutcomeAt");
      return without(l, keys);
    }
    case "back": // one step back, for a mis-click
      if (l.referralAppliedAt) return without(l, ["referralAppliedAt"]);
      if (l.applied) return without({ ...l, applied: false }, ["appliedAt"]);
      if (l.referral) return without({ ...l, referral: false }, ["referralAt"]);
      return l;
    default:
      return l;
  }
}

// Move one or more of a company's links, keeping the company's own status in
// step: applying makes it Applied, reopening a rejected company makes it
// Applied again, and taking back its only application returns it to To Apply.
function makeMover(entryOf, patchCompany) {
  return (companyId, linkIds, to) => {
    const ids = new Set([].concat(linkIds));
    const entry = entryOf(companyId);
    const status = entry.status || "none";
    const now = Date.now();
    const links = (entry.links || []).map((l) => (ids.has(l.id) ? moveLink(l, to, now) : l));
    const patch = { links };
    if ((to === "applied" || to === "appliedViaReferral") && !APPLIED_SET.has(status)) patch.status = "applied";
    if (to === "reopen" && status === "rejected") patch.status = "applied";
    if (to === "back" && status === "applied" && !links.some((l) => l.applied || l.referralAppliedAt)) patch.status = "toApply";
    patchCompany(companyId, patch);
  };
}

function makeRemove(entryOf, patchCompany) {
  return (companyId, linkId) => {
    const prevLinks = entryOf(companyId).links || [];
    const removed = prevLinks.find((l) => l.id === linkId);
    patchCompany(companyId, { links: prevLinks.filter((l) => l.id !== linkId) });
    toast.info(
      ({ closeToast }) => (
        <span className="text-sm">
          Removed <span className="font-semibold">{(removed?.label || "opening").slice(0, 40)}</span>{" "}
          <button
            onClick={() => {
              patchCompany(companyId, { links: prevLinks });
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
function JobCard({ company, aside, children }) {
  return (
    <div className={`${CARD} rounded-xl p-3.5`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-gray-800 dark:text-gray-100">{company.name}</span>
            {company.pay && <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">₹{company.pay} LPA</span>}
            {company.careers && (
              <a href={company.careers} target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400" title="Careers page">
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

function Row({ link, icon, iconCls, linkCls = "text-gray-800 dark:text-gray-100", meta, metaCls, onBack, backTitle, onRemove, children }) {
  return (
    <li>
      <div className="flex items-center gap-1.5 text-sm min-w-0">
        <span className={`shrink-0 w-4 text-center ${iconCls}`}>{icon}</span>
        <a href={link.url} target="_blank" rel="noreferrer" title={link.url} className={`truncate font-medium hover:underline ${linkCls}`}>
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

function Section({ stage, title, count, hint, onAdd, children }) {
  const t = TONES[stage];
  return (
    <section className="min-w-0">
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

  // One card per company per section, holding that company's links in it.
  const groups = { toApply: [], referral: [], applied: [], closed: [] };
  allCompanies.forEach((company) => {
    const entry = entryOf(company.id);
    const links = entry.links || [];
    const by = { toApply: [], referral: [], applied: [], closed: [] };
    links.forEach((l) => by[linkStage(l, entry)].push(l));
    Object.keys(by).forEach((stage) => {
      if (by[stage].length) groups[stage].push({ company, entry, links: by[stage] });
    });
    // Marked "To Apply" in Companies without a job link yet.
    if (!links.length && entry.status === "toApply") groups.toApply.push({ company, entry, links: [] });
  });
  // Newest first, so the top of each stack is what you touched last.
  Object.entries(groups).forEach(([stage, list]) => {
    const newest = (g) => Math.max(0, ...g.links.map((l) => STAGE_TIME[stage](l, g.entry) || 0));
    list.sort((a, b) => newest(b) - newest(a));
  });
  const count = (stage) => groups[stage].reduce((n, g) => n + g.links.length, 0);

  const stale = groups.referral.flatMap((g) =>
    g.links.filter((l) => daysSince(l.referralAt) >= STALE_ASK_DAYS).map((l) => ({ companyId: g.company.id, id: l.id }))
  );
  const closeStale = () => {
    const byCompany = {};
    stale.forEach((s) => (byCompany[s.companyId] = [...(byCompany[s.companyId] || []), s.id]));
    Object.entries(byCompany).forEach(([companyId, ids]) => move(companyId, ids, "noReply"));
  };

  const clearClosed = () => {
    const before = groups.closed.map((g) => ({ id: g.company.id, links: g.entry.links || [] }));
    const n = count("closed");
    before.forEach(({ id, links }) => {
      const entry = entryOf(id);
      patchCompany(id, { links: links.filter((l) => linkStage(l, entry) !== "closed") });
    });
    toast.info(
      ({ closeToast }) => (
        <span className="text-sm">
          Cleared {n} closed{" "}
          <button
            onClick={() => {
              before.forEach(({ id, links }) => patchCompany(id, { links }));
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
  const rowProps = (g, l) => ({ link: l, onRemove: () => removeLink(g.company.id, l.id) });
  const mv = (g, l, to) => () => move(g.company.id, l.id, to);

  const toApplyCards = groups.toApply.map((g) => ({
    key: g.company.id,
    node: (
      <JobCard company={g.company}>
        {g.links.length === 0 && (
          <li className="text-xs text-gray-400 dark:text-gray-500 italic">Marked "To Apply" in Companies. Add its job link with + Add.</li>
        )}
        {g.links.map((l) => {
          const added = agoLabel(l.addedAt);
          return (
            <Row key={l.id} {...rowProps(g, l)} icon="○" iconCls="text-amber-500" meta={added && `added ${added}`}>
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
      <JobCard company={g.company}>
        {g.links.map((l) => {
          const isStale = daysSince(l.referralAt) >= STALE_ASK_DAYS;
          const asked = agoLabel(l.referralAt);
          return (
            <Row
              key={l.id}
              {...rowProps(g, l)}
              icon="↗"
              iconCls="text-violet-500"
              meta={asked && (isStale ? `no reply · ${asked}` : `asked ${asked}`)}
              metaCls={isStale ? "text-amber-600 dark:text-amber-300" : undefined}
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
      <JobCard company={g.company} aside={<StatusSelect value={g.entry.status} onChange={(v) => patchCompany(g.company.id, { status: v })} />}>
        {g.links.map((l) => {
          const when = agoLabel(appliedTime(l, g.entry));
          const viaReferral = !!l.referralAppliedAt;
          return (
            <Row
              key={l.id}
              {...rowProps(g, l)}
              icon="✓"
              iconCls="text-emerald-500"
              meta={when && `applied ${when}`}
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
      <JobCard company={g.company}>
        {g.links.map((l) => {
          const when = agoLabel(closedTime(l));
          const reason = l.closedReason === "noReply" ? "No reply" : "Rejected";
          return (
            <Row
              key={l.id}
              {...rowProps(g, l)}
              icon="•"
              iconCls="text-gray-400"
              linkCls="text-gray-500 dark:text-gray-400"
              meta={when ? `${reason} · ${when}` : reason}
              metaCls={reason === "Rejected" ? "text-rose-500 dark:text-rose-300" : undefined}
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
    <div className="grid gap-6 lg:grid-cols-3 items-start">
      <Section stage="toApply" title="To Apply" count={count("toApply")} hint="Jobs you plan to apply to. Mark each one when you act on it." onAdd={toggleAdd("toApply")}>
        {addForm("toApply")}
        <Stack items={toApplyCards} empty="Nothing to apply to yet. Add a job link." />
      </Section>

      <Section stage="referral" title="Asked for Referral" count={count("referral")} hint="Waiting on a referral. Mark Applied once you apply with it." onAdd={toggleAdd("referral")}>
        {addForm("referral")}
        {stale.length > 0 && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-300/60 dark:border-amber-400/25 bg-amber-50 dark:bg-amber-400/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
            <span className="flex-1">
              {stale.length} {stale.length === 1 ? "ask has" : "asks have"} had no reply for {STALE_ASK_DAYS}+ days.
            </span>
            <button onClick={closeStale} className="shrink-0 font-bold underline">
              Move to Closed
            </button>
          </div>
        )}
        <Stack items={referralCards} empty="No referral asks waiting." />
      </Section>

      <div className="space-y-8 min-w-0">
        <Section stage="applied" title="Applied" count={count("applied")} hint="Applied directly or with a referral. Set the stage as it moves." onAdd={toggleAdd("applied")}>
          {addForm("applied")}
          <Stack items={appliedCards} empty="No applications yet." />
        </Section>

        {closedCards.length > 0 && (
          <Section stage="closed" title="Closed" count={count("closed")} hint="Rejected or no reply. Out of the way, not lost.">
            <Stack items={closedCards} empty="" />
            <button onClick={clearClosed} className="mt-1 text-xs font-semibold text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400">
              Clear all closed
            </button>
          </Section>
        )}
      </div>
    </div>
  );
}
