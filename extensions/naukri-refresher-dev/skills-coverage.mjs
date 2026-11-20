// Checks the skills dictionary (extensions/naukri-refresher/skills-dict.js) against real job
// descriptions: how many skills it finds per JD, and the tech words those JDs use that it doesn't
// know yet (so they can be added).
//
//   node extensions/naukri-refresher-dev/skills-coverage.mjs <jds.json> [--top=150] [--ai]
//
// <jds.json> is an array of { title, text }, e.g. engineering JDs from public job boards
// (Greenhouse, Lever, Ashby). The JDs themselves aren't kept in the repo.
import { readFileSync } from 'node:fs';
import { findSkills, skillOf } from '../naukri-refresher/skills-dict.js';

const file = process.argv[2];
if (!file) { console.error('usage: node skills-coverage.mjs <jds.json> [--top=150] [--ai]'); process.exit(1); }
const top = Number((process.argv.find((a) => a.startsWith('--top=')) || '--top=150').slice(6));
const jds = JSON.parse(readFileSync(file, 'utf8'));

// Words that look like names in a JD but aren't tech: company words, places, perks, roles, legal.
const STOP = new Set(`a an the and or of in on at to for with by from as is are be we you our your their this that these those it its
experience years year strong good great excellent solid deep proven hands-on knowledge understanding familiarity ability skills skill
team teams work working build building design designing develop developing development engineer engineers engineering software
senior junior lead staff principal manager management product products customer customers user users business data system systems
service services platform platforms application applications tools tool technologies technology frameworks framework languages
language including such like e.g etc plus bonus preferred required nice must have has should will can may other others both one more
us usa india remote hybrid onsite bengaluru bangalore hyderabad pune mumbai delhi gurgaon gurugram noida chennai london new york
san francisco seattle eeo pto 401k benefits equity salary compensation insurance health dental vision paid leave holidays
inc llc ltd pvt company companies startup startups ceo cto vp hr ai ml it qa ui ux api apis sdk sdks os ide ides ci cd sql nosql
bachelor bachelors master masters degree phd bs ms btech b.tech m.tech mca computer science cs field equivalent related
english communication collaboration ownership leadership mentoring stakeholders cross-functional agile scrum
monday tuesday wednesday thursday friday saturday sunday q1 q2 q3 q4 h1 h2 jan feb mar apr may jun jul aug sep oct nov dec
gen z we're you'll you're we'll it's don't`.split(/\s+/).filter(Boolean));

// Names the dictionary finds only from their context ("Java, Go", "C/C++"), and halves of "CI/CD".
const CONTEXT = new Set(['go', 'c', 'r', 'swift', 'spring', 'react', 'node', 'rest', 'ci', 'cd', 'cd pipelines', 'ci pipelines', 'lambda', 'oracle', 'chef', 'packer']);
const norm = (s) => s.replace(/\s+/g, ' ').replace(/^[\s\-–—:*•·.]+|[\s\-–—:*•·.]+$/g, '').trim();
const looksTech = (s) => /[A-Z].*[A-Z]|[a-z][A-Z]|\d|[.+#]\w|^[A-Z][a-z]+$/.test(s);

const missed = new Map(); // term → { n, jds: Set, sample }
let totalCounted = 0;
let thin = 0;
const aiRows = [];
jds.forEach((jd, i) => {
  const text = `${jd.title}\n${jd.text}`;
  const found = findSkills(text);
  const counted = [...found.keys()].filter((l) => skillOf(l).count);
  totalCounted += counted.length;
  if (counted.length < 4) thin += 1;
  // How AI-heavy it reads (the job finder's list split), for the --ai report.
  let ai = 0;
  let all = 0;
  for (const l of counted) {
    const s = skillOf(l);
    const w = s.weight * Math.min(found.get(l), 3);
    all += w;
    if (s.ai) ai += w;
  }
  aiRows.push({ title: jd.title, share: all ? ai / all : 0, n: counted.length });

  for (const line of jd.text.split(/\n|(?<=\.)\s+(?=[A-Z])/)) {
    // Only lines that list technologies: two or more skills the dictionary already knows.
    const inLine = [...findSkills(line).keys()].filter((l) => skillOf(l).count);
    if (inLine.length < 2) continue;
    const items = line.split(/,|;|\/|\(|\)|•|·|\s+(?:and|or|&)\s+|:\s/).map(norm).filter((x) => x && x.length <= 32 && x.split(' ').length <= 4);
    for (const item of items) {
      if (findSkills(item).size > 0) continue;
      const words = item.toLowerCase().split(/\s+/);
      if (words.every((w) => STOP.has(w) || w.length < 2)) continue;
      if (CONTEXT.has(item.toLowerCase())) continue; // names found only in context (Go in "Java, Go")
      if (!looksTech(item) && words.length > 2) continue;
      const k = item.toLowerCase();
      const m = missed.get(k) || { n: 0, jds: new Set(), sample: line.slice(0, 140) };
      m.n += 1;
      m.jds.add(i);
      missed.set(k, m);
    }
  }
});

console.log(`JDs: ${jds.length} · counted skills per JD: ${(totalCounted / jds.length).toFixed(1)} · JDs naming under 4: ${thin}`);
const rows = [...missed.entries()].filter(([, m]) => m.jds.size >= 3).sort((a, b) => b[1].jds.size - a[1].jds.size).slice(0, top);
console.log(`\nTech-looking terms the dictionary doesn't know (in 3+ JDs), most common first:`);
for (const [k, m] of rows) console.log(`${String(m.jds.size).padStart(4)}  ${k}   ·  ${m.sample}`);

// A few JDs with what was found in them, to check for wrong finds by eye.
if (process.argv.includes('--samples')) {
  for (const jd of jds.filter((_, i) => i % Math.ceil(jds.length / 12) === 0)) {
    const found = findSkills(`${jd.title}\n${jd.text}`);
    console.log(`\n# ${jd.title}\n  ${[...found.entries()].map(([l, n]) => `${l}${skillOf(l).count ? '' : '°'}${n > 1 ? `×${n}` : ''}`).join(', ')}`);
  }
}

if (process.argv.includes('--ai')) {
  const aiTitle = /\b(?:ai|ml|llm|genai|gen ai|generative|machine learning|applied scientist|nlp|agent)/i;
  const bucket = (rows2) => {
    const xs = rows2.map((r) => r.share).sort((a, b) => a - b);
    const q = (p) => xs.length ? xs[Math.floor(p * (xs.length - 1))].toFixed(2) : '-';
    return `${rows2.length} JDs · AI share p10 ${q(0.1)} · median ${q(0.5)} · p90 ${q(0.9)}`;
  };
  console.log(`\nAI-titled:  ${bucket(aiRows.filter((r) => aiTitle.test(r.title)))}`);
  console.log(`Other:      ${bucket(aiRows.filter((r) => !aiTitle.test(r.title)))}`);
  const odd = aiRows.filter((r) => !aiTitle.test(r.title) && r.share >= 0.3).slice(0, 15);
  for (const r of odd) console.log(`  non-AI title, AI share ${r.share.toFixed(2)}: ${r.title}`);
}
