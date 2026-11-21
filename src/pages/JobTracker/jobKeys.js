// The same job, wherever it was found: its Naukri job id, its link, or its company and title.
// The Openings tab's two views (📡 All openings, from the PC radar, and ⭐ Naukri, from the job
// finder) come from the same stored openings and are loaded together, so they're matched as
// they're shown: no extra database. Any one key in common means the same job.
//   - Naukri id: the number at the end of a naukri.com/job-listings-… link (the finder's own id).
//   - Link: lowercased, without #fragments, tracking parameters or a trailing slash.
//   - Company + title: "Acme Technologies Pvt Ltd" is "acme"; "Java Developer (Immediate
//     Joiners) - Bangalore" is "java developer". Reposts and the same role on two boards match.
// Plain JS (no JSX) so the Node tests can load it.

const words = (s) => ` ${String(s ?? '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/\(.*?\)|\[.*?\]/g, ' ')
  .replace(/[^a-z0-9+#]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()} `;
// Words that don't tell two companies apart, or two openings of one role.
const CO_NOISE = / (?:the|india|pvt|private|ltd|limited|llp|llc|inc|incorporated|corp|corporation|co|technologies|technology|software|solutions|services|systems|labs|global|group) /g;
const TITLE_NOISE = new RegExp(` (?:${[
  'hiring', 'for', 'urgent', 'urgently', 'immediate', 'immediately', 'joiner', 'joiners', 'joining', 'opening', 'openings', 'vacancy', 'wfo', 'wfh',
  'hybrid', 'remote', 'onsite', 'work from office', 'india', 'bangalore', 'bengaluru', 'hyderabad', 'pune', 'chennai', 'mumbai', 'gurgaon', 'gurugram',
  'noida', 'delhi', 'ncr', 'kolkata', 'ahmedabad', 'kochi', 'jaipur', 'indore', 'chandigarh', 'coimbatore', 'trivandrum', 'thiruvananthapuram', 'mysore', 'mysuru',
].join('|')}) `, 'g');
const strip = (s, rx) => {
  let t = s;
  for (let i = 0; i < 4; i++) t = t.replace(rx, ' '); // back-to-back noise words share a space
  return t.replace(/\s+/g, ' ').trim();
};

export const companyKey = (s) => strip(words(s), CO_NOISE);
export const titleKey = (s) => strip(words(s), TITLE_NOISE);

const NAUKRI_ID = /naukri\.com\/job-listings-.*?-(\d{9,})/i;
const linkKey = (u) => String(u || '')
  .trim()
  .toLowerCase()
  .replace(/#.*$/, '')
  .replace(/[?&](?:utm_[a-z]+|src|source|ref|lang)=[^&]*/g, '')
  .replace(/[?&]$/, '')
  .replace(/^https?:\/\/(?:www\.)?/, '')
  .replace(/\/+$/, '');

/** The company + title key of a job (also for a pipeline link: its company and label), or null. */
export function roleKey(company, title) {
  const c = companyKey(company);
  const t = titleKey(title);
  return c && t ? `t:${c}|${t}` : null;
}

/** An opening's keys: any one in common with another opening's means the same job. */
export function jobKeys(o) {
  const keys = [];
  const id = (String(o.url || '').match(NAUKRI_ID) || [])[1] || (o.finder === 'naukri' && /^\d{9,}$/.test(String(o.openingId || '')) ? o.openingId : null);
  if (id) keys.push(`n:${id}`);
  const link = linkKey(o.url);
  if (link) keys.push(`u:${link}`);
  const role = roleKey(o.company, o.title);
  if (role) keys.push(role);
  return keys;
}
