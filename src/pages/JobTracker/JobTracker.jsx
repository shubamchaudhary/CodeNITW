import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import PageSkeleton from "../../components/PageSkeleton";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import { GLASS } from "../../components/glass";
import PageShell from "../../components/PageShell";
import { KEYS, loadJSON, saveJSON, subscribe, quietly } from "../../Data/planStore";
import { requireAuth } from "../../Data/authGate";
import { whenSynced } from "../../Data/cloudSync";
import { isOwner } from "../../components/OwnerRoute";
import { COMPANIES } from "../../Data/jobTrackerCompanies";
import { APPLIED_SET, ERASE_AFTER_DAYS, uid, linkStage, customCompany, eraseCold } from "./shared";
import PipelineTab from "./PipelineTab";
import CompaniesTab from "./CompaniesTab";

// Contacts are the owner's alone: their code, the seeded HR contacts and the
// referral templates are split into chunks that are only ever requested for
// the owner account, so they never reach anyone else.
const ContactsTab = lazy(() => import("./ContactsTab"));
const OWNER_TABS = new Set(["contacts"]);

// Bump this token to force a one-time clean slate for every user on next load.
// Used when the company roster is regenerated (new IDs) so stale per-company
// tracking from the old roster doesn't linger.
const PIPELINE_RESET_TOKEN = "v7-2026-07";

// Only these fields are kept, so anything retired (the old Openings tab's
// dismissed-openings map) drops out of storage with the next save.
function loadState() {
  const s = loadJSON(KEYS.JOB_TRACKER, {});
  // One-time reset: wipe all pipeline tracking (links/statuses) so the tracker
  // starts fresh against the v7 roster. Custom companies the user added are
  // preserved.
  if (s.pipelineReset !== PIPELINE_RESET_TOKEN) {
    // Contacts are independent of the company roster, so they survive the reset.
    return {
      companies: {},
      custom: s.custom || [],
      contacts: s.contacts || [],
      contactEdits: s.contactEdits || {},
      pipelineReset: PIPELINE_RESET_TOKEN,
    };
  }
  return {
    companies: s.companies || {},
    custom: s.custom || [],
    contacts: s.contacts || [],
    contactEdits: s.contactEdits || {},
    pipelineReset: s.pipelineReset,
  };
}

const TABS = [
  { id: "pipeline", label: "Pipeline", emoji: "📋" },
  { id: "contacts", label: "Contacts", emoji: "📇" },
  { id: "companies", label: "Companies", emoji: "🏢" },
];

// ── Page ─────────────────────────────────────────────────────────────────────
export default function JobTracker() {
  const [activeTab, setActiveTab] = useState("pipeline");
  const [state, setState] = useState(loadState);
  const [user, setUser] = useState(undefined); // undefined while auth loads
  const owner = isOwner(user);
  const [ownerData, setOwnerData] = useState({ templates: null, seedContacts: [] });

  useEffect(() => onAuthStateChanged(getAuth(), (u) => setUser(u || null)), []);

  // The owner's private data, fetched only once we know it's the owner.
  useEffect(() => {
    if (!owner) {
      setOwnerData({ templates: null, seedContacts: [] });
      return undefined;
    }
    let alive = true;
    Promise.all([import("../../Data/referralTemplates"), import("../../Data/hrContacts")]).then(([t, h]) => {
      if (alive) setOwnerData({ templates: t.REFERRAL_TEMPLATES, seedContacts: h.SEED_HR_CONTACTS });
    });
    return () => {
      alive = false;
    };
  }, [owner]);

  useEffect(
    () =>
      subscribe((key) => {
        if (key === KEYS.JOB_TRACKER) setState(loadState());
      }),
    []
  );

  // Persist the one-time reset once on mount so it's written back to storage
  // (and pushed to cloud sync), not just held in memory.
  useEffect(() => {
    const raw = loadJSON(KEYS.JOB_TRACKER, {});
    if (raw.pipelineReset !== PIPELINE_RESET_TOKEN) {
      quietly(() => saveJSON(KEYS.JOB_TRACKER, {
        companies: {},
        custom: raw.custom || [],
        contacts: raw.contacts || [],
        contactEdits: raw.contactEdits || {},
        pipelineReset: PIPELINE_RESET_TOKEN,
      }));
    }
  }, []);

  const persist = useCallback((next) => {
    setState(next);
    saveJSON(KEYS.JOB_TRACKER, next);
  }, []);

  const patchCompany = useCallback(
    (id, patch) => {
      if (!requireAuth("Sign in to track your applications — your pipeline is saved to your account.")) return;
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
      if (!requireAuth("Sign in to track your applications — your pipeline is saved to your account.")) return;
      persist({ ...state, custom: [...state.custom, company] });
    },
    [state, persist]
  );

  // A job link added from the Pipeline: the company is picked by name (a name
  // not in the list becomes a company of your own), and the link starts in the
  // section it was added from. One write, so the new company and its link
  // can't come apart. Returns false when a guest is asked to sign in instead.
  const addJob = useCallback(({ companyName, url, role, stage }) => {
    if (!requireAuth("Sign in to track your applications — your pipeline is saved to your account.")) return false;
    // Ids and the time are made once, outside the updater, which may run twice.
    const name = companyName.trim();
    const fresh = customCompany({ name });
    const now = Date.now();
    const link = { id: uid(), label: role || "Opening", url, applied: false, addedAt: now };
    setState((prev) => {
      let company = [...COMPANIES, ...prev.custom].find((c) => c.name.toLowerCase() === name.toLowerCase());
      let custom = prev.custom;
      if (!company) {
        company = fresh;
        custom = [...custom, company];
      }
      const added = { ...link };
      if (stage === "referral") Object.assign(added, { referral: true, referralAt: now });
      if (stage === "applied") Object.assign(added, { applied: true, appliedAt: now });
      const entry = prev.companies[company.id] || {};
      const status = entry.status || "none";
      const merged = { ...entry, links: [...(entry.links || []), added] };
      if (stage === "applied" && !APPLIED_SET.has(status)) {
        merged.status = "applied";
        merged.appliedAt = entry.appliedAt || now;
      } else if (status === "none") merged.status = "toApply";
      const next = { ...prev, custom, companies: { ...prev.companies, [company.id]: merged } };
      saveJSON(KEYS.JOB_TRACKER, next);
      return next;
    });
    return true;
  }, []);

  // ── HR contacts ────────────────────────────────────────────────────────────
  // Contacts come from three places: the seeded vCard import, hrContacts saved
  // on a company card, and ones added in the Contacts tab. Only the last kind
  // lives in `contacts`; edits/removals of the other two are recorded as
  // patches in `contactEdits` keyed by the contact's synthetic id.
  const persistState = useCallback((updater) => {
    setState((prev) => {
      const next = updater(prev);
      saveJSON(KEYS.JOB_TRACKER, next);
      return next;
    });
  }, []);

  const addContact = useCallback(
    (data) => {
      persistState((prev) => ({ ...prev, contacts: [...prev.contacts, { id: `hc-${uid()}`, ...data }] }));
    },
    [persistState]
  );

  // Write a patch to a contact regardless of which source it came from: ones
  // added here are updated in place, seeded/company ones get an id-keyed patch.
  const patchContact = useCallback(
    (id, data) => {
      persistState((prev) =>
        prev.contacts.some((c) => c.id === id)
          ? { ...prev, contacts: prev.contacts.map((c) => (c.id === id ? { ...c, ...data } : c)) }
          : { ...prev, contactEdits: { ...prev.contactEdits, [id]: { ...prev.contactEdits[id], ...data } } }
      );
    },
    [persistState]
  );

  const editContact = useCallback(
    (id, data) => {
      patchContact(id, data);
    },
    [patchContact]
  );

  const deleteContact = useCallback(
    (c) => {
      const undo = () =>
        persistState((prev) =>
          c.source === "custom"
            ? { ...prev, contacts: [...prev.contacts, c] }
            : {
                ...prev,
                contactEdits: { ...prev.contactEdits, [c.id]: { ...prev.contactEdits[c.id], deleted: false } },
              }
        );
      persistState((prev) =>
        c.source === "custom"
          ? { ...prev, contacts: prev.contacts.filter((x) => x.id !== c.id) }
          : {
              ...prev,
              contactEdits: { ...prev.contactEdits, [c.id]: { ...prev.contactEdits[c.id], deleted: true } },
            }
      );
      toast.info(
        ({ closeToast }) => (
          <span className="text-sm">
            Removed <span className="font-semibold">{(c.name || "contact").slice(0, 30)}</span>{" "}
            <button
              onClick={() => {
                undo();
                closeToast();
              }}
              className="underline font-semibold text-indigo-600 dark:text-indigo-300"
            >
              Undo
            </button>
          </span>
        ),
        { autoClose: 4000 }
      );
    },
    [persistState]
  );

  // Erase job links left untouched for ERASE_AFTER_DAYS (the rules are in
  // shared.jsx). Only for a signed-in account, and only once this session has
  // caught up with the cloud: erasing a stale local copy would push it over
  // edits made on another device. Says what went, with an Undo.
  useEffect(() => {
    if (!user) return undefined;
    return whenSynced(() => {
      const before = loadState().companies;
      const result = eraseCold(before);
      if (!result) return;
      persistState((prev) => {
        const r = eraseCold(prev.companies);
        return r ? { ...prev, companies: r.companies } : prev;
      });
      const changed = Object.keys(before).filter((id) => result.companies[id] !== before[id]);
      const undo = () =>
        persistState((prev) => ({
          ...prev,
          companies: { ...prev.companies, ...Object.fromEntries(changed.map((id) => [id, before[id]])) },
        }));
      toast.info(
        ({ closeToast }) => (
          <span className="text-sm">
            Erased {result.erased} job{result.erased === 1 ? "" : "s"} untouched for {ERASE_AFTER_DAYS}+ days{" "}
            <button
              onClick={() => {
                undo();
                closeToast();
              }}
              className="underline font-semibold"
            >
              Undo
            </button>
          </span>
        ),
        { autoClose: 8000 }
      );
    });
  }, [user, persistState]);

  // Tab badge count — mirrors the merge the Contacts tab does.
  const contactCount = useMemo(() => {
    const edits = state.contactEdits;
    let n = ownerData.seedContacts.filter((c) => !edits[c.id]?.deleted).length;
    Object.entries(state.companies).forEach(([cid, e]) =>
      (e.hrContacts || []).forEach((hc) => {
        if (!edits[`co-${cid}-${hc.id}`]?.deleted) n += 1;
      })
    );
    return n + state.contacts.filter((c) => !edits[c.id]?.deleted).length;
  }, [state.contacts, state.contactEdits, state.companies, ownerData.seedContacts]);

  const allCompanies = useMemo(() => [...COMPANIES, ...state.custom], [state.custom]);

  const entryOf = useCallback((id) => state.companies[id] || {}, [state.companies]);

  // Job links per pipeline stage (see linkStage), plus company-level progress.
  const stats = useMemo(() => {
    const n = { toApply: 0, referral: 0, applied: 0, closed: 0 };
    let inProcess = 0;
    let offers = 0;
    allCompanies.forEach((c) => {
      const e = state.companies[c.id] || {};
      const status = e.status || "none";
      (e.links || []).forEach((l) => {
        n[linkStage(l, e)] += 1;
      });
      if (status === "oa" || status === "interview") inProcess += 1;
      if (status === "offer") offers += 1;
    });
    return { total: allCompanies.length, ...n, inProcess, offers };
  }, [allCompanies, state.companies]);

  const statTiles = [
    { label: "Companies", value: stats.total, cls: "text-gray-800 dark:text-gray-100" },
    { label: "To Apply", value: stats.toApply, cls: "text-amber-600 dark:text-amber-300" },
    { label: "Referral", value: stats.referral, cls: "text-violet-600 dark:text-violet-300" },
    { label: "Applied", value: stats.applied, cls: "text-blue-600 dark:text-blue-300" },
    { label: "In Process", value: stats.inProcess, cls: "text-indigo-600 dark:text-indigo-300" },
    { label: "Offers", value: stats.offers, cls: "text-emerald-600 dark:text-emerald-300" },
  ];

  if (user === undefined) return <PageSkeleton />;

  // Everyone gets Pipeline and Companies (their own tracking, the shared company
  // list). Contacts exist only for the owner.
  const tabs = owner ? TABS : TABS.filter((t) => !OWNER_TABS.has(t.id));
  const currentTab = tabs.some((t) => t.id === activeTab) ? activeTab : "pipeline";

  return (
    <PageShell>
      <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-8 py-6">
        {/* Header */}
        <h1 className="text-2xl lg:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 dark:from-indigo-400 dark:via-violet-400 dark:to-indigo-300 mb-5">
          Job Application Tracker
        </h1>

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

        {/* Tab navigation */}
        <div className={`${GLASS} rounded-xl p-1 mb-5 inline-flex gap-1`}>
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            let count = null;
            if (tab.id === "pipeline") count = stats.toApply + stats.referral + stats.applied;
            if (tab.id === "contacts") count = contactCount;
            if (tab.id === "companies") count = stats.total;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                }`}
              >
                <span className="mr-1.5">{tab.emoji}</span>
                {tab.label}
                {count != null && (
                  <span
                    className={`ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {currentTab === "pipeline" && (
          <PipelineTab
            allCompanies={allCompanies}
            entryOf={entryOf}
            patchCompany={patchCompany}
            addJob={addJob}
          />
        )}

        {currentTab === "contacts" && (
          <Suspense fallback={null}>
          <ContactsTab
            allCompanies={allCompanies}
            companies={state.companies}
            customContacts={state.contacts}
            contactEdits={state.contactEdits}
            onAddContact={addContact}
            onEditContact={editContact}
            onPatchContact={patchContact}
            onDeleteContact={deleteContact}
          />
          </Suspense>
        )}

        {currentTab === "companies" && (
          <CompaniesTab
            allCompanies={allCompanies}
            companies={state.companies}
            patchCompany={patchCompany}
            addCustom={addCustom}
            entryOf={entryOf}
            templates={ownerData.templates}
          />
        )}
      </div>
    </PageShell>
  );
}
