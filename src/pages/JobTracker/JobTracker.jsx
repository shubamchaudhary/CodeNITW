import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { GLASS } from "../../components/glass";
import { KEYS, loadJSON, saveJSON, subscribe } from "../../Data/planStore";
import { COMPANIES } from "../../Data/jobTrackerCompanies";
import {
  APPLIED_SET,
  RADAR_SOURCES,
  uid,
  normUrl,
  uKeyOf,
  DISMISS_TTL_DAYS,
  migrateDismissals,
  isOpeningEligible,
} from "./shared";
import PipelineTab from "./PipelineTab";
import ContactsTab from "./ContactsTab";
import OpeningsTab from "./OpeningsTab";
import CompaniesTab from "./CompaniesTab";
import { SEED_HR_CONTACTS } from "../../Data/hrContacts";

// Bump this token to force a one-time clean slate for every user on next load.
// Used when the company roster is regenerated (new IDs) so stale per-company
// tracking + dismissals from the old roster don't linger.
const PIPELINE_RESET_TOKEN = "v7-2026-07";

function loadState() {
  const s = loadJSON(KEYS.JOB_TRACKER, {});
  // One-time reset: wipe all pipeline tracking (links/statuses) and dismissed
  // openings so the tracker starts fresh against the v7 roster + stricter
  // filters. Custom companies the user added are preserved.
  if (s.pipelineReset !== PIPELINE_RESET_TOKEN) {
    // Contacts are independent of the company roster, so they survive the reset.
    return {
      companies: {},
      custom: s.custom || [],
      dismissedOpenings: {},
      contacts: s.contacts || [],
      contactEdits: s.contactEdits || {},
      pipelineReset: PIPELINE_RESET_TOKEN,
    };
  }
  // Upgrade any legacy dismissal entries so crosses made before the identity
  // format changed keep working across this (and future) deployments.
  const { map: dismissedOpenings } = migrateDismissals(s.dismissedOpenings || {});
  return {
    companies: s.companies || {},
    custom: s.custom || [],
    dismissedOpenings,
    contacts: s.contacts || [],
    contactEdits: s.contactEdits || {},
    pipelineReset: s.pipelineReset,
  };
}

const TABS = [
  { id: "pipeline", label: "Pipeline", emoji: "📋" },
  { id: "contacts", label: "Contacts", emoji: "📇" },
  { id: "openings", label: "Openings", emoji: "📡" },
  { id: "companies", label: "Companies", emoji: "🏢" },
];

// ── Page ─────────────────────────────────────────────────────────────────────
export default function JobTracker() {
  const [activeTab, setActiveTab] = useState("pipeline");
  const [state, setState] = useState(loadState);
  const [radar, setRadar] = useState(null);

  useEffect(
    () =>
      subscribe((key) => {
        if (key === KEYS.JOB_TRACKER) setState(loadState());
      }),
    []
  );

  // Persist the one-time reset / migrated dismissal map once on mount so the
  // change is written back to storage (and pushed to cloud sync), not just held
  // in memory.
  useEffect(() => {
    const raw = loadJSON(KEYS.JOB_TRACKER, {});
    if (raw.pipelineReset !== PIPELINE_RESET_TOKEN) {
      saveJSON(KEYS.JOB_TRACKER, {
        companies: {},
        custom: raw.custom || [],
        dismissedOpenings: {},
        contacts: raw.contacts || [],
        contactEdits: raw.contactEdits || {},
        pipelineReset: PIPELINE_RESET_TOKEN,
      });
      return;
    }
    const { map, changed } = migrateDismissals(raw.dismissedOpenings || {});
    if (changed) {
      const next = { ...raw, companies: raw.companies || {}, custom: raw.custom || [], dismissedOpenings: map };
      saveJSON(KEYS.JOB_TRACKER, next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      toast.success(`${company.name} added`);
    },
    [state, persist]
  );

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
      toast.success(`${data.name || "Contact"} added`);
    },
    [persistState]
  );

  const editContact = useCallback(
    (id, data) => {
      persistState((prev) =>
        prev.contacts.some((c) => c.id === id)
          ? { ...prev, contacts: prev.contacts.map((c) => (c.id === id ? { ...c, ...data } : c)) }
          : { ...prev, contactEdits: { ...prev.contactEdits, [id]: { ...prev.contactEdits[id], ...data } } }
      );
      toast.success("Contact updated");
    },
    [persistState]
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

  // Tab badge count — mirrors the merge the Contacts tab does.
  const contactCount = useMemo(() => {
    const edits = state.contactEdits;
    let n = SEED_HR_CONTACTS.filter((c) => !edits[c.id]?.deleted).length;
    Object.entries(state.companies).forEach(([cid, e]) =>
      (e.hrContacts || []).forEach((hc) => {
        if (!edits[`co-${cid}-${hc.id}`]?.deleted) n += 1;
      })
    );
    return n + state.contacts.filter((c) => !edits[c.id]?.deleted).length;
  }, [state.contacts, state.contactEdits, state.companies]);

  const allCompanies = useMemo(() => [...COMPANIES, ...state.custom], [state.custom]);

  const entryOf = useCallback((id) => state.companies[id] || {}, [state.companies]);

  const companiesById = useMemo(() => Object.fromEntries(allCompanies.map((c) => [c.id, c])), [allCompanies]);

  const radarCoveredIds = useMemo(
    () => new Set(radar?.summary?.coveredCompanyIds || []),
    [radar]
  );

  // Radar with each opening stamped with a collision-proof `uKey` and a
  // `tracked` flag (already saved as a link). Tracked openings are kept in the
  // data — not filtered out — so a company's group stays visible even after its
  // last opening is queued; OpeningsTab just hides tracked rows from the list.
  const radarVisible = useMemo(() => {
    if (!radar) return null;
    const trackedUrls = new Set();
    Object.values(state.companies).forEach((e) =>
      (e.links || []).forEach((l) => trackedUrls.add(normUrl(l.url)))
    );
    // Dedupe by uKey (the posting URL). Some boards emit several distinct-titled
    // rows that point at the exact same apply URL — those are the same
    // application, so collapse them to one row. Without this, tracking one would
    // mark every sibling `tracked` (same URL) and hide them while queuing only
    // one, making the others look "lost". Keep the earliest firstSeen.
    const byKey = new Map();
    for (const o of radar.openings) {
      const uKey = uKeyOf(o);
      const existing = byKey.get(uKey);
      if (!existing) {
        byKey.set(uKey, { ...o, uKey });
      } else if (new Date(o.firstSeen) < new Date(existing.firstSeen)) {
        byKey.set(uKey, { ...existing, firstSeen: o.firstSeen });
      }
    }
    const openings = [...byKey.values()].map((o) => ({
      ...o,
      tracked: trackedUrls.has(normUrl(o.url)),
    }));
    return { ...radar, openings };
  }, [radar, state.companies]);

  // Purge dismissals only by age — NOT by whether the opening is in the current
  // scan. This keeps a crossed-out opening dismissed across redeploys and
  // transient feed gaps; it only expires after DISMISS_TTL_DAYS.
  useEffect(() => {
    if (!radar) return;
    const cutoff = Date.now() - DISMISS_TTL_DAYS * 24 * 60 * 60 * 1000;
    setState((prev) => {
      const stale = Object.entries(prev.dismissedOpenings)
        .filter(([, v]) => typeof v === "number" && v < cutoff)
        .map(([k]) => k);
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
    },
    [state.companies, patchCompany]
  );

  // No confirmation dialog — direct dismiss per user request. Store the dismiss
  // time so the map can be aged out later without resurrecting recent crosses.
  const rejectOpening = useCallback((o) => {
    const k = o.uKey || uKeyOf(o);
    setState((prev) => {
      const next = { ...prev, dismissedOpenings: { ...prev.dismissedOpenings, [k]: Date.now() } };
      saveJSON(KEYS.JOB_TRACKER, next);
      return next;
    });
  }, []);

  const unrejectOpening = useCallback((o) => {
    const k = o.uKey || uKeyOf(o);
    setState((prev) => {
      const dismissedOpenings = { ...prev.dismissedOpenings };
      delete dismissedOpenings[k];
      const next = { ...prev, dismissedOpenings };
      saveJSON(KEYS.JOB_TRACKER, next);
      return next;
    });
  }, []);

  const stats = useMemo(() => {
    let inProcess = 0;
    let offers = 0;
    let pendingOpenings = 0;
    let referralOpenings = 0;
    let appliedOpenings = 0;
    allCompanies.forEach((c) => {
      const e = state.companies[c.id] || {};
      const status = e.status || "none";
      const links = e.links || [];
      pendingOpenings += links.filter((l) => !l.applied && !l.referral).length;
      referralOpenings += links.filter((l) => l.referral).length;
      appliedOpenings += links.filter((l) => l.applied).length;
      if (status === "oa" || status === "interview") inProcess += 1;
      if (status === "offer") offers += 1;
    });
    return { total: allCompanies.length, toApply: pendingOpenings, referral: referralOpenings, applied: appliedOpenings, inProcess, offers };
  }, [allCompanies, state.companies]);

  const activeOpeningsCount = radarVisible?.openings.filter((o) => !o.tracked && !state.dismissedOpenings[o.uKey] && isOpeningEligible(o)).length || 0;

  const statTiles = [
    { label: "Companies", value: stats.total, cls: "text-gray-800 dark:text-gray-100" },
    { label: "To Apply", value: stats.toApply, cls: "text-amber-600 dark:text-amber-300" },
    { label: "Referral", value: stats.referral, cls: "text-violet-600 dark:text-violet-300" },
    { label: "Applied", value: stats.applied, cls: "text-blue-600 dark:text-blue-300" },
    { label: "In Process", value: stats.inProcess, cls: "text-indigo-600 dark:text-indigo-300" },
    { label: "Offers", value: stats.offers, cls: "text-emerald-600 dark:text-emerald-300" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-16">
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
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            let count = null;
            if (tab.id === "pipeline") count = stats.toApply + stats.referral + stats.applied;
            if (tab.id === "contacts") count = contactCount;
            if (tab.id === "openings") count = activeOpeningsCount;
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
        {activeTab === "pipeline" && (
          <PipelineTab
            allCompanies={allCompanies}
            entryOf={entryOf}
            patchCompany={patchCompany}
          />
        )}

        {activeTab === "contacts" && (
          <ContactsTab
            allCompanies={allCompanies}
            companies={state.companies}
            customContacts={state.contacts}
            contactEdits={state.contactEdits}
            onAddContact={addContact}
            onEditContact={editContact}
            onDeleteContact={deleteContact}
          />
        )}

        {activeTab === "openings" && (
          <OpeningsTab
            radarVisible={radarVisible}
            companiesById={companiesById}
            allCompanies={allCompanies}
            rejectedKeys={state.dismissedOpenings}
            onTrack={trackOpening}
            onReject={rejectOpening}
            onUnreject={unrejectOpening}
            onManualAdd={manualAddOpening}
          />
        )}

        {activeTab === "companies" && (
          <CompaniesTab
            allCompanies={allCompanies}
            companies={state.companies}
            patchCompany={patchCompany}
            addCustom={addCustom}
            radarCoveredIds={radarCoveredIds}
            entryOf={entryOf}
          />
        )}
      </div>
    </div>
  );
}
