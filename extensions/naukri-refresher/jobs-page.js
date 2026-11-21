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
let barLoaded = false;

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
  $('sJds').textContent = (s.daily && s.daily.jds) || 0;
  $('sPages').textContent = (s.daily && s.daily.pages) || 0;
  $('sSent').textContent = (s.daily && s.daily.uploaded) || 0;
  $('nSkills').textContent = s.skillCount;
  $('skillsDate').textContent = s.skillsGenerated || '';
  if (document.activeElement !== $('scope')) $('scope').value = s.settings.scope;
  $('scopeSearches').textContent = `This browser searches: ${s.searches.join(' · ')}.`;
  if (!barLoaded) {
    const [lo, hi] = s.rules.minScoreRange;
    for (let p = Math.round(lo * 100); p <= Math.round(hi * 100); p += 5) $('minScore').add(new Option(`${p}%`, String(p / 100)));
    $('minScore').value = String(s.settings.minScore);
    barLoaded = true;
  }
  let next = s.settings.enabled ? (s.plan ? `Next run ${fmtWhen(s.plan.at, now)} IST.` : '') : 'The finder is off (switch it on in the popup).';
  if (s.running) next = 'Running now…';
  if (s.queued) next += ` ${s.queued} job pages wait to be read.`;
  if (s.pending) next += ` ${s.pending} kept jobs wait to be sent.`;
  $('nextLine').textContent = next;
  const w = s.sweep;
  $('sweepLine').textContent = !w ? 'The first run starts the sweep through every page of every search.'
    : w.done ? `Sweep ${w.n} read every page of all ${w.searches} searches (${w.pages} pages, ${fmtWhen(w.started, now)} to ${fmtWhen(w.finished, now)} IST). The next run starts a new one.`
      : `Sweep ${w.n}, started ${fmtWhen(w.started, now)} IST: ${w.over} of ${w.searches} searches read to the end, ${w.pages} pages so far. The next run carries on.`;
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
    td.colSpan = 8;
    tr.append(td);
    tb.append(tr);
  }
  const scopeLabel = { both: '', backend: ' · Backend', ai: ' · AI' };
  for (const r of s.runs) {
    const tr = el('tr');
    tr.append(el('td', fmtWhen(r.t, now)), el('td', `${r.trigger || ''}${scopeLabel[r.scope] || ''}`), el('td', String(r.pages || 0), 'n'),
      el('td', String(r.jds || 0), 'n'), el('td', String(r.read || 0), 'n'), el('td', String(r.kept || 0), 'n'), el('td', String(r.uploaded || 0), 'n'),
      el('td', r.outcome === 'ok' ? r.note || '' : `${r.outcome}: ${r.note || ''}`, r.outcome === 'ok' ? '' : 'warn'));
    tb.append(tr);
  }

  const R = s.rules;
  const L = s.limits;
  const rules = $('rules');
  rules.replaceChildren();
  const of = (p) => s.allSearches.filter((x) => x.profile === p).map((x) => x.k).join(' · ');
  for (const t of [
    `Every listing, not a sample: the runs read every page of every search (up to ${L.pagesPerSearch} pages each), one page of each search in turn. A run goes on for up to ${L.runMinutes} minutes and the next one carries on where it stopped; once every search is read to the end, the next run starts a new sweep for what's new. At most ${L.pagesPerDay} pages and ${L.jdPerDay} job pages a day.`,
    `First the card. It must be posted in the last ${R.maxAgeH} hours, as Naukri labels it ("Just now", "Few hours ago", "1 day ago"); "2 days ago" and older are out. A card that doesn't say passes. A job you already applied to on Naukri is out, when its card or its page says so.`,
    'Title: not Android, iOS, mobile, .NET, PHP, frontend-only, QA/testing, DevOps, data, SAP/Salesforce-type platforms, embedded, support, C/C++ systems work, or lead/architect/manager. A plain "Software Engineer/Developer" passes.',
    `Experience: asks for less than ${R.maxMinYears} years, and isn't a 0–1 year fresher role. A card that doesn't say passes.`,
    `Pay: reaches ${R.minPayL} LPA when the listing gives a salary. One it doesn't give passes.`,
    `Skill chips: when they name 3 or more known technologies and under ${Math.round(R.cardFloor * 100)}% are yours, the job is another stack and its page isn't opened. Chips that aren't technologies are ignored.`,
    `Then the JD. The finder opens the job's page, finds every technology the JD asks for with the skills dictionary (over a thousand skills), and compares them with yours. The job is kept when at least ${Math.round(s.settings.minScore * 100)}% are yours. "Nice to have" lines, company blurbs and perks don't count. A JD naming fewer than ${R.minJdSkills} technologies is held to the same bar and ranked a little lower; one naming none is kept.`,
    `The list: AI when the title is an AI one, or when GenAI/ML work is ${Math.round(R.aiShare * 100)}%+ of the JD's technology. Otherwise Backend. A job is on one list only.`,
    `Your site shows the top ${R.showTop} of each list posted in the last ${R.showHours} hours, highest JD match first (ties by rank: title, experience, pay, company rating, how fresh), leaving out what you applied to, skipped or have in the pipeline. A job whose JD was read in the last 3 days isn't opened again.`,
    `Backend searches: ${of('backend')}.`,
    `AI searches: ${of('ai')}.`,
  ]) rules.append(el('li', t));
  $('sample').textContent = s.sample ? JSON.stringify(s.sample, null, 2) : 'Nothing read yet.';
  $('jdSample').textContent = s.jdSample ? JSON.stringify(s.jdSample, null, 2) : 'Nothing read yet.';
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
$('saveBar').addEventListener('click', async () => {
  await send('jobsSave', { patch: { minScore: Number($('minScore').value) } });
  $('barOut').textContent = `Saved ${istHM(Date.now())}. Press "Re-scan today" to apply it to jobs already decided.`;
  refresh();
});
$('saveExtra').addEventListener('click', async () => {
  await send('jobsSave', { patch: { extraSkills: $('extra').value } });
  $('extraOut').textContent = `Saved ${istHM(Date.now())}. Press "Re-scan today" to apply them to jobs already decided.`;
});
$('now').addEventListener('click', async () => { $('now').disabled = true; await send('jobsNow'); refresh(); });
$('rescan').addEventListener('click', async () => { await send('jobsRescan'); refresh(); });
$('resume').addEventListener('click', async () => { await send('jobsResume'); refresh(); });

refresh();
setInterval(refresh, 2000);
