// career-ops source for the radar: runs career-ops' own zero-token scanner
// (scan.mjs) from the checkout setup.ps1 makes in .radar/career-ops, over the
// employers in career-ops-companies.yml.
//
// Each run writes a fresh portals.yml into .radar/career-ops-data (title
// keywords from your resume, India-only locations) and clears career-ops'
// scan history there first, so it reports every current match, not just ones
// it hasn't shown before — the radar does its own "new" tracking. Results are
// read back from the data/pipeline.md career-ops writes:
//   - [ ] {url} | {company} | {title} | {location} | {pay} | posted: {date}
//
// The same checkout gets your resume as cv.md, so career-ops' own modes
// (evaluating a posting, tailoring the CV) work there too.

import { spawn } from "child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const HERE = dirname(fileURLToPath(import.meta.url));

const NEGATIVE = [
  "Senior", "word:Sr", "Staff", "Principal", "Lead", "Manager", "Director", "Architect", "Head",
  "word:Intern", "Internship", "word:QA", "SDET", "Test", "Quality", "iOS", "Android", "Mobile",
  "Frontend", "Front End", "Front-end", "Embedded", "Firmware", "Sales", "Support",
];
// Matched as substrings, so no "IND" (it would admit Indiana).
const INDIA = ["India", "Bengaluru", "Bangalore", "Hyderabad", "Pune", "Gurugram", "Gurgaon", "Noida", "Chennai", "Mumbai", "Delhi", "Kolkata", "Ahmedabad", "Kochi"];

// career-ops' title filter matches a plain entry as a substring, so a
// lowercase resume phrase works as is.
function portalsYaml(companiesYaml, titleKeywords) {
  const list = (xs) => xs.map((x) => `    - ${JSON.stringify(x)}`).join("\n");
  const companies = companiesYaml
    .split(/\r?\n/)
    .filter((l) => !/^\s*#/.test(l))
    .map((l) => (l.trim() ? `  ${l}` : l))
    .join("\n");
  return `# Written by scripts/radar/careerops.mjs on every run — edit scripts/radar/career-ops-companies.yml instead.
location_filter:
  strict: true
  remote_title_fallback: false
  allow:
${list(INDIA)}
title_filter:
  positive:
${list(titleKeywords)}
  negative:
${list(NEGATIVE)}
tracked_companies:
${companies}
`;
}

export function writeCv(stateDir, resumeText) {
  const root = join(stateDir, "career-ops");
  if (!existsSync(join(root, "scan.mjs")) || !resumeText) return;
  writeFileSync(join(root, "cv.md"), `<!-- Copied from your resume PDF by the CodeNITW radar; it is replaced when the PDF changes. -->\n\n${resumeText.trim()}\n`);
}

export async function fetchCareerOpsJobs({ stateDir, titleKeywords, sinceDays = 14, log = console.log }) {
  const root = join(stateDir, "career-ops");
  if (!existsSync(join(root, "scan.mjs"))) {
    log("career-ops: skipped — not installed yet (run scripts/radar/setup.ps1)");
    return { jobs: [], skipped: true };
  }
  const data = join(stateDir, "career-ops-data");
  mkdirSync(join(data, "data"), { recursive: true });
  const portals = join(data, "portals.yml");
  writeFileSync(portals, portalsYaml(readFileSync(join(HERE, "career-ops-companies.yml"), "utf8"), titleKeywords));
  for (const f of ["data/pipeline.md", "data/scan-history.tsv"]) rmSync(join(data, f), { force: true });

  await new Promise((resolve) => {
    const child = spawn(process.execPath, [join(root, "scan.mjs"), "--since", String(sinceDays), "--quiet"], {
      cwd: data,
      env: { ...process.env, CAREER_OPS_ROOT: data, CAREER_OPS_PORTALS: portals },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const keep = (d) =>
      String(d)
        .split(/\r?\n/)
        .filter((l) => /Companies scanned|New offers added|unreachable|Errors|✗/.test(l))
        .forEach((l) => log(`  career-ops ${l.trim()}`));
    child.stdout.on("data", keep);
    child.stderr.on("data", keep);
    const timer = setTimeout(() => child.kill(), 10 * 60 * 1000);
    child.on("close", () => {
      clearTimeout(timer);
      resolve();
    });
  });

  const pipeline = join(data, "data/pipeline.md");
  const jobs = [];
  if (existsSync(pipeline)) {
    for (const line of readFileSync(pipeline, "utf8").split(/\r?\n/)) {
      const m = line.match(/^- \[ \] (https?:\/\/\S+) \| ([^|]+) \| ([^|]+)(.*)$/);
      if (!m) continue;
      const rest = m[4].split("|").map((s) => s.trim());
      const posted = rest.find((s) => s.startsWith("posted:"));
      jobs.push({
        source: "careerops",
        ats: "careerops",
        id: m[1],
        company: m[2].trim(),
        title: m[3].trim(),
        location: rest[1] && !rest[1].includes(":") ? rest[1] : "",
        url: m[1],
        postedAt: posted ? posted.slice(7).trim() : null,
        desc: "",
      });
    }
  }
  log(`career-ops: ${jobs.length} jobs`);
  return { jobs };
}
