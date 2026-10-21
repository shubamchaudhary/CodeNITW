// Your resume drives the radar's keywords.
//
// Each run reads the resume PDF (RESUME_PDF in .radar/.env, default
// ~/Downloads/SHUBAM_CHAUDHARY_RESUME_SDE.pdf) and derives:
//   skills       — what the skills match scores against: every skill in the
//                  scorer's dictionary that the resume mentions, plus each
//                  item listed under "Technical Skills"
//   searchTerms  — what JobSpy searches Naukri/Indeed/Glassdoor for, from the
//                  headline ("Software Engineer | Distributed Systems, ...")
//                  and the first language and framework listed
//   titleKeywords — what career-ops' title filter accepts
// Update the PDF and the next run uses it; nothing else to edit. The text is
// cached in .radar/resume.txt and re-extracted only when the PDF changes.
// Without a readable resume, radar/skills.json's lists are used instead.

import { execFileSync } from "child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { SKILL_DEFS } from "../scoreOpening.mjs";

export const DEFAULT_RESUME_PDF = join(homedir(), "Downloads", "SHUBAM_CHAUDHARY_RESUME_SDE.pdf");

// pdftotext ships with Git for Windows; Task Scheduler's PATH may not have it.
const PDFTOTEXT = ["pdftotext", "C:\\Program Files\\Git\\mingw64\\bin\\pdftotext.exe", "C:\\Program Files\\Git\\usr\\bin\\pdftotext.exe"];

function pdfToText(pdf) {
  for (const exe of PDFTOTEXT) {
    try {
      return execFileSync(exe, ["-layout", "-enc", "UTF-8", pdf, "-"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    } catch (_) {
      // try the next location
    }
  }
  throw new Error("pdftotext not found (it comes with Git for Windows)");
}

// → { text, changed } — `changed` when the PDF is new or different since the
// last run, so the radar knows to re-score what it already has.
export function loadResumeText({ stateDir, pdfPath = DEFAULT_RESUME_PDF, log = console.log }) {
  const txtPath = join(stateDir, "resume.txt");
  const metaPath = join(stateDir, "resume.json");
  const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, "utf8")) : {};
  if (existsSync(pdfPath)) {
    const mtime = statSync(pdfPath).mtimeMs;
    if (meta.pdf === pdfPath && meta.mtime === mtime && existsSync(txtPath)) return { text: readFileSync(txtPath, "utf8"), changed: false };
    try {
      const text = pdfToText(pdfPath);
      const changed = !existsSync(txtPath) || readFileSync(txtPath, "utf8") !== text;
      writeFileSync(txtPath, text);
      writeFileSync(metaPath, JSON.stringify({ pdf: pdfPath, mtime, at: new Date().toISOString() }));
      log(`Resume: read ${pdfPath}${changed ? " (changed)" : ""}`);
      return { text, changed };
    } catch (e) {
      log(`Resume: couldn't read ${pdfPath} (${e.message})`);
    }
  } else {
    log(`Resume: ${pdfPath} not found`);
  }
  return { text: existsSync(txtPath) ? readFileSync(txtPath, "utf8") : null, changed: false };
}

const lines = (text) =>
  text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

// "Languages: Java, Python, C++" lines under the Technical Skills heading.
function skillLines(text) {
  const out = {};
  let inSkills = false;
  for (const l of lines(text)) {
    if (/^technical skills\b/i.test(l)) {
      inSkills = true;
      continue;
    }
    if (inSkills && /^(experience|projects|education|achievements|certifications)\b/i.test(l)) break;
    const m = inSkills && l.match(/^([A-Za-z &/]+):\s*(.+)$/);
    if (m) out[m[1].trim().toLowerCase()] = m[2];
  }
  return out;
}

// "Azure (APIM, Key Vault)" → "Azure"; "JavaScript (Node.js)" → "JavaScript".
const items = (s) =>
  String(s || "")
    .replace(/\([^)]*\)/g, "")
    .split(/,|;/)
    .map((x) => x.replace(/&/g, "and").trim())
    .filter((x) => x && x.length <= 30);

export function resumeProfile(text) {
  const t = ` ${text} `;
  const fromDictionary = SKILL_DEFS.filter(([, rx]) => rx.test(t)).map(([label]) => label);
  const sections = skillLines(text);
  const listed = Object.values(sections).flatMap(items);
  const skills = [...new Set([...fromDictionary, ...listed])];

  // Headline: the first line with "|" that names a role, e.g.
  // "Software Engineer | Distributed Systems, Microservices, GenAI | B.Tech, NIT Warangal"
  const headline = lines(text).find((l) => l.includes("|") && /engineer|developer/i.test(l)) || "";
  const [role = "software engineer", focus = ""] = headline.split("|").map((s) => s.trim().toLowerCase());
  const focusAreas = items(focus).map((f) => f.toLowerCase());
  const lang = (items(sections.languages)[0] || "java").toLowerCase();
  const framework = (items(sections.frameworks)[0] || "").toLowerCase();

  const searchTerms = [
    `${lang} ${framework} developer`.replace(/\s+/g, " "),
    `backend engineer ${lang}`,
    ...focusAreas.map((f) => `${role} ${f}`),
  ];
  const titleKeywords = [role, ...focusAreas, lang, "backend", "back end", "back-end", "sde", "software developer", "software development engineer", "platform engineer", "full stack", "member of technical staff"];

  return {
    skills,
    searchTerms: [...new Set(searchTerms)].slice(0, 4),
    titleKeywords: [...new Set(titleKeywords.filter(Boolean))],
    headline,
  };
}
