// Employers whose pay at about 2 years of experience is well under your bar: India's big IT
// services, consulting, outsourcing and engineering-services firms. One list for everything that
// finds jobs for you (no imports, so each can load it):
//   - the Naukri job finder drops their listings on the card, before any JD is opened (its
//     settings can replace the list in that browser, one company per line);
//   - the PC radar (scripts/radar/run.mjs) drops their openings and deletes stored copies;
//   - your site's Openings tab hides what's still stored from before.
// A name matches whole words of the company's name, so "HCL" isn't "HCLTech" (both are listed).
//
// Left off on purpose (they can reach 25 LPA, or the name catches more than the services arm):
// NTT DATA (levels.fyi India median ₹27.7L), Persistent Systems (median ₹21.6L), CGI (top 10%
// ₹28.6L), IBM and Fujitsu (their research and software labs), Nucleus Software and Intellect
// Design Arena (product companies), Infogain, Ness Digital Engineering, and the whole L&T group
// (only Larsen & Toubro Infotech is listed).
export const LOW_PAY_COMPANIES = Object.freeze([
  'Accenture', 'TCS', 'Tata Consultancy Services', 'Infosys', 'Wipro', 'Cognizant', 'Capgemini', 'HCL', 'HCLTech', 'Tech Mahindra',
  'LTIMindtree', 'Mindtree', 'L&T Infotech', 'Larsen & Toubro Infotech', 'L&T Technology Services', 'LTTS', 'Mphasis', 'Hexaware',
  'Coforge', 'NIIT Technologies', 'Birlasoft', 'Zensar', 'Sonata Software', 'Mastek', 'Cyient', 'KPIT', 'Happiest Minds',
  'DXC Technology', 'Virtusa', 'UST Global', 'UST', 'Deloitte', 'PwC', 'PricewaterhouseCoopers', 'EY', 'Ernst & Young', 'KPMG',
  'Genpact', 'WNS', 'EXL', 'EXL Service', 'Concentrix', 'Teleperformance', 'Firstsource', 'Sutherland', 'HGS', 'Hinduja Global Solutions',
  'iGate', 'Syntel', 'Atos', 'Sopra Steria', 'Unisys', 'NEC', 'Datamatics', '3i Infotech', 'Cybage', 'Quest Global', 'Tata Elxsi',
  'Tata Technologies', 'Sasken', 'Expleo', 'Alten', 'Infinite Computer Solutions', 'Trigent', 'Kellton', 'InfoBeans', 'Saksoft',
  'Mindteck', 'R Systems',
]);

const companyWords = (s) => ` ${String(s ?? '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim()} `;

/** A list of company names (yours from the finder's settings, or the default) → what lowPayMatch checks against. */
export function lowPayList(names = LOW_PAY_COMPANIES) {
  return [...new Set((Array.isArray(names) ? names : []).map(companyWords).filter((w) => w.trim()))];
}
const LOW_PAY = lowPayList();

/** The entry of `list` a company's name matches (whole words), or null. */
export function lowPayMatch(company, list = LOW_PAY) {
  const name = companyWords(company);
  return list.find((w) => name.includes(w)) || null;
}
