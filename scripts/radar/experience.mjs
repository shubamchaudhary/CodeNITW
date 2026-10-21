// Experience check for the radar: the years an opening asks for.
//
// Signals, most trusted first: the board's own experience field (Naukri's
// "5-10 Yrs"), a range in the title ("Software Engineer, 4-8 Yrs"), then the
// job description. Undefined when nothing says.
//
// In a description, the overall ask ("3+ years of professional software
// development experience") is what counts, not a side skill ("2+ years with
// Kafka"), so: only the text before any "preferred / nice to have" section;
// the largest number on a line about professional/industry/software
// experience; failing that, the smallest number next to "experience".

export const FITS_MAX = 2; // asks for this many years or fewer → "fits"
export const STRETCH_MAX = 3; // one more year → "stretch"; anything above is dropped

const RANGE_RX = /(\d{1,2})\s*(?:-|–|to)\s*\d{1,2}\s*(?:yrs?|years?)|(\d{1,2})\s*\+\s*(?:yrs?|years?)/i;

function fromRange(s) {
  const m = RANGE_RX.exec(s || "");
  if (!m) return undefined;
  return parseInt(m[1] ?? m[2], 10);
}

const YEARS_RX = /(\d{1,2})\s*(?:\+|-|–|—|to)?\s*(?:\d{1,2})?\s*\+?\s*(?:years?|yrs?)\b/g;
const PREFERRED_RX = /\b(preferred qualifications|preferred skills|nice[ -]to[ -]have|good to have|bonus points|preferred:)/;
const CORE_RX =
  /\b(professional|industry|overall|total|relevant|software (development|engineering)|engineering experience|development experience|work experience|working experience|hands[- ]on)\b/;

export function yearsFromDescription(text) {
  if (!text) return undefined;
  let t = String(text).toLowerCase();
  const pref = t.search(PREFERRED_RX);
  if (pref > 200) t = t.slice(0, pref);
  const core = [];
  const any = [];
  for (const m of t.matchAll(YEARS_RX)) {
    const n = parseInt(m[1], 10);
    if (n > 20) continue;
    const around = t.slice(Math.max(0, m.index - 40), m.index + m[0].length + 70);
    if (!/\bexp(erience|ertise)?\b/.test(around)) continue;
    any.push(n);
    if (CORE_RX.test(around)) core.push(n);
  }
  if (core.length) return Math.max(...core);
  if (any.length) return Math.min(...any);
  return undefined;
}

export function minYears(job) {
  const field = fromRange(job.experienceRange);
  if (field !== undefined) return field;
  const title = fromRange(job.title);
  if (title !== undefined) return title;
  return yearsFromDescription(job.desc);
}

export function experienceTag(years) {
  if (years === undefined) return "unknown";
  if (years <= FITS_MAX) return "fits";
  if (years <= STRETCH_MAX) return "stretch";
  return "too-senior";
}
