import { fmtWhen, istHM } from './lib.js';
import { SITE_JOBS_URL } from './jobs-lib.js';

const ext = globalThis.browser ?? globalThis.chrome;
const $ = (id) => document.getElementById(id);
const send = (type, extra = {}) => ext.runtime.sendMessage({ type, ...extra });
const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text != null) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};

let extraLoaded = false;

function chips(root, pairs, empty) {
  root.replaceChildren();
  if (!pairs.length) { root.append(el('span', empty, 'muted small')); return; }
  for (const [k, n] of pairs) root.append(el('span', `${k} · ${n}`, 'chip'));
}

function siteLine(s, now) {
  const line = $('siteLine');
  const rejected = !!(s.halted && s.halted.short === 'site token rejected');
  if (!s.access.site) { line.className = 'small warn'; line.textContent = 'No access to your site yet: press Allow access in the popup.'; return; }
  if (!s.settings.hasToken) { line.className = 'small warn'; line.textContent = 'Not connected yet.'; return; }
  if (rejected) { line.className = 'small err'; line.textContent = 'Your site turned the token down. Open its Job tracker here to connect again.'; return; }
  line.className = 'small ok';
  line.textContent = s.settings.viaSite
    ? `Connected by your site${s.settings.pairedAt ? ` (${fmtWhen(s.settings.pairedAt, now)} IST)` : ''}.`
    : 'Connected with a pasted token.';
}

function render(s) {
  const now = Date.now();
  $('halted').hidden = !s.halted;
  if (s.halted) $('haltedMsg').textContent = s.halted.msg || s.halted.short;
  siteLine(s, now);
  const kept = (s.daily && s.daily.kept) || {};
  $('sBackend').textContent = kept.backend || 0;
  $('sAi').textContent = kept.ai || 0;
  $('sRead').textContent = (s.daily && s.daily.read) || 0;
  $('sPages').textContent = (s.daily && s.daily.pages) || 0;
  $('sSent').textContent = (s.daily && s.daily.uploaded) || 0;
  $('nBackend').textContent = s.profileSkills.backend;
  $('nAi').textContent = s.profileSkills.ai;
  if (document.activeElement !== $('scope')) $('scope').value = s.settings.scope;
  $('scopeSearches').textContent = `This browser searches: ${s.searches.join(' · ')}.`;
  let next = s.settings.enabled ? (s.plan ? `Next run ${fmtWhen(s.plan.at, now)} IST.` : '') : 'The finder is off (switch it on in the popup).';
  if (s.running) next = 'Running now…';
  if (s.pending) next += ` ${s.pending} kept jobs wait to be sent.`;
  $('nextLine').textContent = next;
  $('now').disabled = s.running || !s.settings.hasToken || !!s.halted;
  $('token').placeholder = s.settings.hasToken ? 'Saved (paste a new one to replace it)' : 'Paste the token';
  if (!extraLoaded) { $('extra').value = s.settings.extraSkills || ''; extraLoaded = true; }

  chips($('reasons'), s.reasons, 'Nothing yet.');
  chips($('unknown'), s.unknown, 'None yet.');

  const tb = $('runs');
  tb.replaceChildren();
  if (!s.runs.length) {
    const tr = el('tr');
    const td = el('td', 'No runs yet.', 'muted');
    td.colSpan = 7;
    tr.append(td);
    tb.append(tr);
  }
  const scopeLabel = { both: '', backend: ' · Backend', ai: ' · AI' };
  for (const r of s.runs) {
    const tr = el('tr');
    tr.append(el('td', fmtWhen(r.t, now)), el('td', `${r.trigger || ''}${scopeLabel[r.scope] || ''}`), el('td', String(r.pages || 0), 'n'), el('td', String(r.read || 0), 'n'),
      el('td', String(r.kept || 0), 'n'), el('td', String(r.uploaded || 0), 'n'),
      el('td', r.outcome === 'ok' ? r.note || '' : `${r.outcome}: ${r.note || ''}`, r.outcome === 'ok' ? '' : 'warn'));
    tb.append(tr);
  }

  const R = s.rules;
  const rules = $('rules');
  if (!rules.childElementCount) {
    const of = (p) => s.allSearches.filter((x) => x.profile === p).map((x) => x.k).join(' · ');
    for (const t of [
      'Two lists, one per Naukri account. An AI-first role (an AI title such as GenAI/LLM/AI Engineer, or mostly GenAI tech in its tags) goes on the AI list and is checked against your GenAI resume. Any other role goes on the Backend list and is checked against your SDE resume. A job is on one list only, so you never apply to it from both accounts.',
      'Posted today (the day runs 4am to 4am IST, like your tracker).',
      'Title: not Android, iOS, mobile, .NET, PHP, frontend-only, QA/testing, DevOps, data, SAP/Salesforce-type platforms, embedded, support, or lead/architect/manager. A plain "Software Engineer/Developer" is kept.',
      `Experience: asks for less than ${R.maxMinYears} years (and isn't a 0–1 year fresher role). A listing that doesn't say is kept.`,
      `Pay: reaches ${R.minPayL} LPA. A salary the listing doesn't show is assumed to be in range.`,
      `Skills: at least ${Math.round(R.minCoverage * 100)}% of the tech in the job's Naukri tags is on that list's resume. Soft skills and vague tags are ignored, and a close substitute (Angular when you know React) counts ${Math.round(R.partial * 100)}%. A listing with no tags is kept.`,
      `Each list is ranked 0–100 (skills, title, experience, pay, company rating, how fresh), and your site shows its top ${R.dailyTop} for the day.`,
      `Backend searches: ${of('backend')}.`,
      `AI searches: ${of('ai')}.`,
    ]) rules.append(el('li', t));
  }
  $('sample').textContent = s.sample ? JSON.stringify(s.sample, null, 2) : 'Nothing read yet.';
}

async function refresh() {
  try { render(await send('jobsStatus')); } catch (e) { $('nextLine').textContent = `Not responding: ${e.message}`; }
}

function showToken(cls, text) {
  const o = $('tokenOut');
  o.hidden = false;
  o.className = `out ${cls}`;
  o.textContent = text;
}

$('connect').addEventListener('click', () => ext.tabs.create({ url: SITE_JOBS_URL, active: true }));
$('saveToken').addEventListener('click', async () => {
  const token = $('token').value.trim();
  if (!token) return showToken('warn', 'Paste the token first.');
  await send('jobsSave', { patch: { token } });
  $('token').value = '';
  const r = await send('jobsTest');
  showToken(r.ok ? 'ok' : 'err', r.ok ? 'Saved. Your site accepts it and knows the job finder.' : `Saved, but: ${r.msg || r.short}.`);
  refresh();
});
$('test').addEventListener('click', async () => {
  const r = await send('jobsTest');
  showToken(r.ok ? 'ok' : 'err', r.ok ? 'Your site accepts the token and knows the job finder.' : `${r.msg || r.short}.`);
});
$('scope').addEventListener('change', async (e) => { await send('jobsSave', { patch: { scope: e.target.value } }); refresh(); });
$('saveExtra').addEventListener('click', async () => {
  await send('jobsSave', { patch: { extraSkills: $('extra').value } });
  $('extraOut').textContent = `Saved ${istHM(Date.now())}. Press "Re-scan today" to apply them to listings already read.`;
});
$('now').addEventListener('click', async () => { $('now').disabled = true; await send('jobsNow'); refresh(); });
$('rescan').addEventListener('click', async () => { await send('jobsRescan'); refresh(); });
$('resume').addEventListener('click', async () => { await send('jobsResume'); refresh(); });

refresh();
setInterval(refresh, 2000);
