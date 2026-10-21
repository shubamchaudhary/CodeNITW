// Experience check for the radar: the range of years an opening asks for, and
// whether YOUR_YEARS falls inside it. "0-2", "1-3", "2-5" and "1+" do; "3+" and
// "3-5" ask for more (no callback at 2.2 years), "0-1" for less.
//
// Signals, most trusted first: the board's own experience field (Naukri's
// "5-10 Yrs"), a range in the title ("Software Engineer, 4-8 Yrs"), then the
// job description. Undefined when nothing says.
//
// In a description, the overall ask ("3+ years of professional software
// development experience") is what counts, not a side skill ("2+ years with
// Kafka"), so: only the text before any "preferred / nice to have" section;
// the highest floor on a line about professional/industry/software
// experience; failing that, the lowest floor next to "experience".

export const YOUR_YEARS = 2;

// { min, max } — max is null for an open-ended ask ("3+ years", "3 years").
const RANGE_RX = /(\d{1,2})\s*(?:(?:-|–|—|to)\s*(\d{1,2})|(\+))?\s*\+?\s*(?:yrs?|years?)\b/i;

function toRange(m) {
  const min = parseInt(m[1], 10);
  const max = m[2] !== undefined ? parseInt(m[2], 10) : null;
  return { min, max: max !== null && max >= min ? max : null };
}

function fromField(s) {
  const m = RANGE_RX.exec(s || "");
  return m ? toRange(m) : undefined;
}

const YEARS_RX = new RegExp(RANGE_RX.source, "gi");
const PREFERRED_RX = /\b(preferred qualifications|preferred skills|nice[ -]to[ -]have|good to have|bonus points|preferred:)/;
const CORE_RX =
  /\b(professional|industry|overall|total|relevant|software (development|engineering)|engineering experience|development experience|work experience|working experience|hands[- ]on)\b/;

export function rangeFromDescription(text) {
  if (!text) return undefined;
  let t = String(text).toLowerCase();
  const pref = t.search(PREFERRED_RX);
  if (pref > 200) t = t.slice(0, pref);
  const core = [];
  const any = [];
  for (const m of t.matchAll(YEARS_RX)) {
    const r = toRange(m);
    if (r.min > 20) continue;
    const around = t.slice(Math.max(0, m.index - 40), m.index + m[0].length + 70);
    if (!/\bexp(erience|ertise)?\b/.test(around)) continue;
    any.push(r);
    if (CORE_RX.test(around)) core.push(r);
  }
  if (core.length) return core.reduce((a, b) => (b.min > a.min ? b : a));
  if (any.length) return any.reduce((a, b) => (b.min < a.min ? b : a));
  return undefined;
}

// The first number of the range, for callers that only need the floor.
export const yearsFromDescription = (text) => rangeFromDescription(text)?.min;

export function experienceRange(job) {
  return fromField(job.experienceRange) || fromField(job.title) || rangeFromDescription(job.desc);
}

// "fits" (YOUR_YEARS is inside the range), "unknown", "too-senior" or "too-junior".
export function experienceTag(range) {
  if (!range) return "unknown";
  if (range.min > YOUR_YEARS) return "too-senior";
  if (range.max !== null && range.max !== undefined && range.max < YOUR_YEARS) return "too-junior";
  return "fits";
}
