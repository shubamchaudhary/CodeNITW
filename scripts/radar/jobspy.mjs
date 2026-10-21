// JobSpy source for the radar: Indian job boards (Naukri, Indeed India,
// Glassdoor India) through github.com/speedyapply/JobSpy, run in the Python
// venv that setup.ps1 creates under .radar/venv.

import { spawn } from "child_process";
import { existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { stripHtml } from "../jobRadar.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

// What to ask each board. The search terms come from your resume (resume.mjs);
// these are only the fallback. Naukri is searched city by city (one all-India
// search returns just ~35 jobs); Indeed and Glassdoor search all of India.
const FALLBACK_TERMS = ["java backend developer", "backend engineer", "software engineer java spring boot"];
const NAUKRI_CITIES = ["Bengaluru", "Hyderabad", "Pune", "Gurugram", "Noida", "Chennai", "Mumbai"];

export function jobspyQueries(terms = FALLBACK_TERMS) {
  const q = [];
  for (const term of terms) {
    for (const city of NAUKRI_CITIES) q.push({ site: "naukri", term, location: city, results: 40 });
    q.push({ site: "indeed", term, location: "India", results: 60 });
  }
  q.push({ site: "glassdoor", term: terms[0], location: "Bengaluru", results: 30 });
  q.push({ site: "glassdoor", term: terms[1] || terms[0], location: "Hyderabad", results: 30 });
  return q;
}

// Salary in lakhs per year from JobSpy's min/max/interval, or null.
function lakhs(amount, interval) {
  if (amount == null || !isFinite(amount)) return null;
  const perYear = { yearly: 1, monthly: 12, weekly: 52, daily: 260, hourly: 2080 }[interval || "yearly"] || 1;
  return Math.round(((amount * perYear) / 1e5) * 10) / 10;
}

export async function fetchJobspyJobs({ stateDir, terms, hoursOld = 72, log = console.log } = {}) {
  const py = join(stateDir, "venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
  if (!existsSync(py)) {
    log("JobSpy: skipped — no venv yet (run scripts/radar/setup.ps1)");
    return { jobs: [], skipped: true };
  }
  const cfgPath = join(stateDir, "jobspy-queries.json");
  writeFileSync(cfgPath, JSON.stringify({ hours_old: hoursOld, queries: jobspyQueries(terms?.length ? terms : undefined) }));

  const raw = await new Promise((resolve, reject) => {
    const child = spawn(py, ["-I", join(HERE, "jobspy_fetch.py"), cfgPath], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => String(d).split(/\r?\n/).filter(Boolean).forEach((l) => log(`  ${l}`)));
    const timer = setTimeout(() => child.kill(), 15 * 60 * 1000);
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0 && !out) return reject(new Error(`jobspy exited with ${code}`));
      resolve(out);
    });
  });

  const rows = JSON.parse(raw || "[]");
  const jobs = rows
    .filter((r) => r.job_url && r.title && r.company)
    .map((r) => {
      const inr = !r.currency || r.currency === "INR";
      return {
        source: r.site,
        ats: r.site,
        id: r.job_url,
        company: r.company,
        title: r.title,
        location: r.location || "",
        url: r.job_url_direct || r.job_url,
        boardUrl: r.job_url,
        postedAt: r.date_posted || null,
        desc: stripHtml(r.description || ""),
        experienceRange: r.experience_range || null,
        // Glassdoor's figures are its own estimates, not the employer's.
        pay:
          inr && (r.min_amount != null || r.max_amount != null)
            ? {
                minL: lakhs(r.min_amount, r.interval),
                maxL: lakhs(r.max_amount, r.interval),
                estimate: r.site === "glassdoor",
                fromText: r.salary_source === "description",
              }
            : null,
      };
    });
  log(`JobSpy: ${jobs.length} jobs from ${new Set(jobs.map((j) => j.source)).size} boards`);
  return { jobs };
}
