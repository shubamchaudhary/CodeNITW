// The company pay database's rules (no imports: the extension, the radar's scripts and the site's
// API all use this one file).
//
// What a company pays a software engineer with about 2 years of experience in India, in LPA, kept in
// Firestore (collection `companyPay`, one document per company) so no company is worked out twice.
// The order is always: look in the database; if it isn't there, look on the internet; if the
// internet gives enough evidence (confidentPay), save it and carry on; if not, carry on without it
// and save nothing. Nothing weak is ever saved, and the API checks the same rules again.

export const PAY_TTL_MS = 90 * 24 * 3_600_000; // a saved figure is trusted this long, then looked up again

const SUFFIX = /\b(?:private|pvt|limited|ltd|llp|inc|corp|corporation|india|technologies|technology|tech|solutions|services|software|systems|labs)\b/g;

/** A company's key in the database: lowercase words joined by "-", legal suffixes and "India" aside. */
export function payKey(company) {
  return String(company ?? '').toLowerCase()
    .replace(/&/g, ' and ')
    .replace(SUFFIX, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Sites that publish what companies pay, by what a source's name or link says.
const KNOWN = [
  ['levels.fyi', /levels\.?fyi/i],
  ['ambitionbox', /ambition\s?box/i],
  ['glassdoor', /glassdoor/i],
  ['6figr', /6\s?figr/i],
  ['payscale', /payscale/i],
];

/** The distinct reputable sources in a list of names or links. */
export function knownSources(list) {
  const out = new Set();
  for (const s of Array.isArray(list) ? list : String(list ?? '').split(/[,;|]|\band\b/)) {
    const t = String(s ?? '');
    for (const [name, rx] of KNOWN) if (rx.test(t)) out.add(name);
  }
  return [...out];
}

const num = (v) => {
  const n = Number(v);
  return v !== null && v !== undefined && v !== '' && Number.isFinite(n) ? n : null;
};

/**
 * Is this evidence enough to save? → { ok, why }.
 *   entry: { lo, hi (LPA), n (reports), sources, src: 'web' | 'levels', same }
 *   - sane numbers: 3 to 150 LPA, the top at most 3.5 times the bottom (a wider range says nothing);
 *   - the page is for this company, not a similar name (same !== false);
 *   - levels.fyi's own figures: at least 10 reports; a web lookup: two reputable sources agreeing, or
 *     one with at least 30 reports behind it.
 */
export function confidentPay(e) {
  if (!e || typeof e !== 'object') return { ok: false, why: 'no figure' };
  const lo = num(e.lo);
  const hi = num(e.hi);
  if (lo == null || hi == null) return { ok: false, why: 'no figure' };
  if (!(lo >= 3 && hi >= lo && hi <= 150)) return { ok: false, why: 'figure out of range' };
  if (hi / lo > 3.5) return { ok: false, why: 'range too wide to mean anything' };
  if (e.same === false) return { ok: false, why: 'not sure it is the same company' };
  const n = num(e.n);
  if (e.src === 'levels') return n != null && n >= 10 ? { ok: true, why: `levels.fyi, ${n} reports` } : { ok: false, why: 'too few reports' };
  const srcs = knownSources(e.sources);
  if (srcs.length >= 2) return { ok: true, why: `${srcs.join(' + ')} agree` };
  if (srcs.length === 1 && n != null && n >= 30) return { ok: true, why: `${srcs[0]}, ${n} reports` };
  return { ok: false, why: srcs.length ? 'only one source, too few reports' : 'no reputable source named' };
}

/** What gets stored: only the fields the rules look at, sizes bounded. */
export function payRecord(e, company, now = Date.now()) {
  const round = (x) => Math.round(x * 10) / 10;
  return {
    key: payKey(company),
    company: String(company ?? '').slice(0, 120),
    lo: round(num(e.lo)),
    hi: round(num(e.hi)),
    med: num(e.med) != null ? round(num(e.med)) : null,
    n: num(e.n) != null ? Math.max(0, Math.round(num(e.n))) : null,
    sources: knownSources(e.sources).slice(0, 5),
    src: e.src === 'levels' ? 'levels' : 'web',
    at: now,
    v: 1,
  };
}

/** A stored figure that may still be used. */
export const payFresh = (rec, now = Date.now()) => !!rec && now - (rec.at || 0) < PAY_TTL_MS && num(rec.lo) != null && num(rec.hi) != null;
