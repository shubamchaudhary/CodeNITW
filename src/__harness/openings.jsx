// TEMPORARY verification harness (deleted after the check): real Openings + Pipeline tabs, mock data.
import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../input.css";
import OpeningsTab from "../pages/JobTracker/OpeningsTab";
import PipelineTab from "../pages/JobTracker/PipelineTab";
import { customCompany, uid, withLedger } from "../pages/JobTracker/shared";

const now = Date.now();
const openings = [];
for (const [profile, n] of [["backend", 4], ["ai", 3]]) {
  for (let i = 0; i < n; i++) {
    openings.push({
      id: `${profile}-${i}`, finder: "naukri", profile, company: `${profile === "ai" ? "AI" : "BE"} Co ${i}`, title: `${profile} engineer ${i}`,
      url: `https://www.naukri.com/job-listings-${profile}-${i}`, postedTime: now - i * 3600000, firstSeen: now,
      coverage: 90 - i, skillsHave: 5, skillsTotal: 8, rank: 60, exp: "fits", pay: { verdict: "unknown" }, matchScore: 80, active: true,
    });
  }
}
openings.push({ id: "radar-0", source: "board", company: "Radar Co", title: "Radar backend dev", url: "https://jobs.example.com/radar-0",
  openedAt: now, firstSeen: now, active: true, exp: "fits", matchScore: 70, pay: { verdict: "meets" } });
localStorage.setItem("radarOpeningsCache.v1", JSON.stringify({ at: now, data: { summary: {}, openings } }));
localStorage.setItem("openingsMode.v1", "naukri");

function Harness() {
  const [custom, setCustom] = useState([]);
  const [companies, setCompanies] = useState({});
  window.__companies = companies;
  const queuedUrls = useMemo(() => new Set(Object.values(companies).flatMap((e) => (e.links || []).map((l) => l.url))), [companies]);
  const addJobs = (items) => {
    items.forEach((it) => {
      const c = customCompany({ name: it.companyName });
      setCustom((p) => (p.some((x) => x.name === c.name) ? p : [...p, c]));
      setCompanies((prev) => {
        const key = Object.keys(prev).find((k) => prev[k].name === it.companyName) || c.id;
        const e = prev[key] || { name: it.companyName };
        const link = { id: uid(), label: it.role, url: it.url, applied: it.stage === "applied", addedAt: now };
        if (it.naukriAccount) link.naukriAccount = it.naukriAccount;
        if (it.stage === "applied") link.appliedAt = now;
        return { ...prev, [key]: { ...e, status: it.stage === "applied" ? "applied" : "toApply", links: [...(e.links || []), link] } };
      });
    });
    return true;
  };
  const allCompanies = custom.map((c) => ({ ...c, id: Object.keys(companies).find((k) => companies[k].name === c.name) || c.id }));
  const patchCompany = (id, change) =>
    setCompanies((prev) => {
      const e = prev[id] || {};
      return { ...prev, [id]: { ...e, ...(typeof change === "function" ? change(e) : change) } };
    });
  return (
    <>
      <OpeningsTab finderExt={null} queuedUrls={queuedUrls} dismissedUrls={new Set()} hidden={{}} onHide={() => {}} onUnhide={() => {}}
        onUnhideAll={() => {}} addJob={(it) => addJobs([it])} removeJob={() => {}} addJobs={addJobs} removeJobs={() => {}} />
      <hr style={{ margin: "24px 0" }} />
      <PipelineTab allCompanies={allCompanies} entryOf={(id) => companies[id] || {}} patchCompany={patchCompany}
        addJob={(it) => addJobs([it])} dismissUrls={() => {}} ledger={withLedger({}, companies)} />
      <ToastContainer position="bottom-right" />
    </>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<Harness />);
