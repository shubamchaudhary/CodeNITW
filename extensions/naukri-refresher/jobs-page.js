import { fmtWhen, istHM } from './lib.js';
import { SITE_JOBS_URL } from './jobs-lib.js';
import { WEIGHTS } from './rate-lib.js';

const GROQ_MATCH = 'https://api.groq.com/*';

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
let rateLoaded = false;
let lowPayLoaded = false;

/** The AI rating's card: on or off (and why), the keys, today's use, what waits. */
function renderRating(s, now) {
  const R = s.rating;
  const line = $('rateLine');
  line.className = R.on ? 'small ok' : 'small warn';
  line.textContent = R.on
    ? `On: ${R.model}, ${R.keys.length} key${R.keys.length === 1 ? '' : 's'}, up to ${R.calls} Groq calls a day in this browser.`
    : `Off: ${R.why}.`;
  $('keysSaved').textContent = R.keys.length ? `Saved: ${R.keys.length} key${R.keys.length === 1 ? '' : 's'} (${R.keys.join(', ')}).` : 'No keys saved.';
  if (!rateLoaded) {
    for (const n of s.rate.callsChoices) $('rateCalls').add(new Option(n ? String(n) : '0 (off)', String(n)));
    rateLoaded = true;
  }
  if (document.activeElement !== $('rateCalls')) $('rateCalls').value = String(R.calls);
  if (document.activeElement !== $('rateModel')) $('rateModel').value = R.model;
  $('rateModel').placeholder = R.defaultModel;
  const t = R.today;
  $('rateToday').textContent = t && t.calls
    ? `Today: ${t.rated.backend || 0} Backend and ${t.rated.ai || 0} AI jobs rated in ${t.calls} calls, ${(t.tokens.input + t.tokens.output).toLocaleString()} tokens (${t.tokens.cached.toLocaleString()} of them cached).${t.fails ? ` ${t.fails} failed.` : ''}${t.last ? ` Last problem: ${t.last.msg}.` : ''}`
    : 'Today: nothing rated yet.';
  const keys = Object.entries((t && t.keys) || {});
  $('rateKeys').textContent = keys.length ? `Per key today: ${keys.map(([h, k]) => `${h} ${k.calls} calls, ${k.ok} rated${k.last && k.last !== 'ok' ? ` (${k.last})` : ''}`).join(' · ')}` : '';
  const last = R.last ? ` Last "Rate now" ${fmtWhen(R.last.t, now)} IST: ${R.last.rated} rated${R.last.note ? `, ${R.last.note}` : ''}.` : '';
  $('rateQueue').textContent = `${R.queued} job${R.queued === 1 ? '' : 's'} wait for a rating.${last} ${R.ratedKept} ratings from the last 3 days are kept, so a job seen again isn't rated twice.`;
  const res = $('rateResumes');
  res.className = R.resumes ? 'small muted' : 'small warn';
  res.textContent = R.resumes
    ? `Resumes it sends: SDE (${R.resumes.sde.toLocaleString()} characters) and GenAI (${R.resumes.genai.toLocaleString()}), ${R.resumes.from === 'test' ? 'test copies' : `made ${R.resumes.generated || 'from your PDFs'}`}, without your name and contact lines.`
    : 'Your resumes aren\'t in the extension yet. Run: node extensions/naukri-refresher-dev/make-job-profile.mjs (it writes resume.local.json next to the extension, which git ignores), then reload the extension.';
  $('rateNow').disabled = s.running || !R.on;
  if (!$('rubric').children.length) {
    for (const t2 of [
      `Must-have requirements your resume shows: ${WEIGHTS.must} points (partly shown counts half).`,
      `Nice-to-haves your resume shows: ${WEIGHTS.nice}.`,
      `Years asked: ${WEIGHTS.years} at up to 2 years, less at 3 or 4, none at 5+.`,
      `Role: ${WEIGHTS.role} for backend (Backend list) or GenAI (AI list), less for full stack, ML or data, none for QA, support or mobile.`,
      `Level: ${WEIGHTS.level} for mid-level, a little less for junior, little for senior, none for lead.`,
      'Caps: QA, support or mobile roles 20 at most; lead roles or 5+ years asked 30 at most; a JD naming fewer than 3 requirements 75 at most.',
      "Checks: a requirement the model names that isn't in the JD is dropped; a \"met\" whose quote isn't in your resume, word for word, counts as not met.",
    ]) $('rubric').append(el('li', t2));
  }
}

function renderLowPay(s) {
  if (lowPayLoaded) return;
  $('lowPay').value = s.lowPay.names.join('\n');
  $('lowPayOut').textContent = `${s.lowPay.names.length} companies${s.lowPay.custom ? ' (your list)' : ' (the default list)'}.`;
  lowPayLoaded = true;
}

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
  let next = s.settings.enabled ? (s.plan ? `Next run ${fmtWhen(s.plan.at, now)} IST.` : '') : 'The finder is off (switch it on in the popup); "Find jobs now" still works.';
  if (s.running) next = s.resting ? `Resting until ${fmtWhen(s.resting.until, now)} IST, then part ${s.resting.part} of this run.` : 'Running now…';
  if (s.queued) next += ` ${s.queued} job pages wait to be read.`;
  if (s.removing) next += ` ${s.removing} jobs wait to come off your site.`;
  next += ` It remembers ${s.judged} jobs it judged in the last 3 days, and skips them.`;
  if (s.startedOver) next += ` Started over ${fmtWhen(s.startedOver, now)} IST.`;
  if (s.pending) next += ` ${s.pending} kept jobs wait to be sent.`;
  $('nextLine').textContent = next;
  const w = s.sweep;
  $('sweepLine').textContent = !w ? 'The first run starts the sweep through every page of every search.'
    : w.done ? `Sweep ${w.n} read every page of all ${w.searches} searches (${w.pages} pages, ${fmtWhen(w.started, now)} to ${fmtWhen(w.finished, now)} IST). The next run starts a new one.`
      : `Sweep ${w.n}, started ${fmtWhen(w.started, now)} IST: ${w.over} of ${w.searches} searches read to the end, ${w.pages} pages so far. The next run carries on.`;
  $('now').disabled = s.running || !s.settings.hasToken || !!s.halted;
  $('startOver').disabled = s.running || !s.settings.hasToken || !!s.halted;
  $('token').placeholder = s.settings.hasToken ? 'Saved (paste a new one to replace it)' : 'Paste the token';
  if (!extraLoaded) { $('extra').value = s.settings.extraSkills || ''; extraLoaded = true; }

  renderRating(s, now);
  renderLowPay(s);
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
    `Every listing, not a sample: once a day, around 17:00 IST, a run reads every page of every search (up to ${L.pagesPerSearch} pages each), one page of each search in turn. It works in stretches of up to ${L.runMinutes} minutes with ${L.restMin}-minute rests (up to ${L.stretches} stretches) until every search is read to the end; where it stops, the next run carries on. At most ${L.pagesPerDay} pages and ${L.jdPerDay} job pages a day.`,
    'No job twice: a listing it judged in the last 3 days (kept or not) is skipped by its id, so no JD is opened twice and nothing is sent or rated twice. "Start over" deletes the finder\'s jobs from your site and forgets all of that, for a fresh run end to end.',
    `First the card. It must be posted in the last ${R.maxAgeH} hours, as Naukri labels it ("Just now", "Few hours ago", "1 day ago"); "2 days ago" and older are out. A card that doesn't say passes. A job you already applied to on Naukri is out, when its card or its page says so.`,
    `Company: one on your low-pay list (${s.lowPay.names.length} companies, such as ${s.lowPay.names.slice(0, 4).join(', ')}) is out before its JD is opened.`,
    'Title: not Android, iOS, mobile, .NET, PHP, frontend-only, MERN/MEAN, Node-only, QA/testing, DevOps, data, SAP/Salesforce-type platforms, embedded, support, C/C++ systems work, lead/architect/manager, or not a software job at all. A plain "Software Engineer/Developer" passes and its JD decides.',
    `Experience: asks for less than ${R.maxMinYears} years, and isn't a 0–1 year fresher role. A card that doesn't say passes.`,
    `Pay: reaches ${R.minPayL} LPA when the listing gives a salary. One it doesn't give passes.`,
    `Skill chips: when they name 3 or more known technologies and under ${Math.round(R.cardFloor * 100)}% are yours, the job is another stack and its page isn't opened. Chips that aren't technologies are ignored.`,
    `Then the JD. The finder opens the job's page, finds every technology the JD asks for with the skills dictionary (over a thousand skills), and compares them with yours. The job is kept when at least ${Math.round(s.settings.minScore * 100)}% are yours. "Nice to have" lines, company blurbs and perks don't count. A JD naming fewer than ${R.minJdSkills} technologies is held to the same bar and ranked a little lower; one naming none is kept.`,
    "The list: the JD's main stack decides. Java ahead of Python and GenAI: Backend. Python with GenAI (LLMs, RAG, agents, LangChain, LangGraph) or FastAPI: AI. JavaScript (React, Node, MERN) or another language ahead: out. A job is on one list only.",
    `Your site gets every job it keeps from the last ${R.maxAgeH} hours (up to ${R.poolTop} a list), highest JD match first (ties by rank: title, experience, pay, company rating, how fresh), with how you apply: on Naukri, or on the company's site (and its link, read off the job's page, never clicked).`,
    `Then the AI rating (above, with your Groq keys): each job sent is rated 1–100 against your resume and sent again with its rating, up to ${s.rating.calls} Groq calls a day in this browser, best JD match first. A key Groq says is at its limit rests 5 s, then 10, 20, 40…, and isn't used again that run if it's still limited a minute later.`,
    `Your site shows each list in two parts: Apply on Naukri, its top ${R.showTop} (Naukri takes 50 applies a day per account), and Apply on company site, all of them. Highest AI rating first; jobs not rated yet come after, highest JD match first. What you applied to, skipped or have in the pipeline is left out, and a job is never shown twice.`,
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
function showKeys(cls, text) {
  const o = $('keysOut');
  o.hidden = false;
  o.className = `out ${cls}`;
  o.textContent = text;
}
$('saveKeys').addEventListener('click', async () => {
  const typed = $('groqKeys').value.trim();
  if (!typed) return showKeys('warn', 'Paste your keys first.');
  // Asked right away, while this click still counts as yours (Firefox needs it; Chrome and Edge already allow it).
  const granted = ext.permissions.request({ origins: [GROQ_MATCH] }).catch(() => false);
  const s = await send('jobsSave', { patch: { groqKeys: typed } });
  $('groqKeys').value = '';
  if (s.error) return showKeys('err', `Not saved: ${s.error}.`);
  const n = s.rating.keys.length;
  showKeys((await granted) ? 'ok' : 'warn', (await granted)
    ? `Saved ${n} key${n === 1 ? '' : 's'}. "Check keys" tries each one.`
    : `Saved ${n} key${n === 1 ? '' : 's'}, but this browser hasn't allowed api.groq.com yet: press Save keys again and allow it.`);
  refresh();
});
$('checkKeys').addEventListener('click', async () => {
  showKeys('muted', 'Asking Groq about each key…');
  const r = await send('jobsKeyCheck');
  const each = (r.keys || []).map((k) => `${k.hint}: ${k.msg}`).join(' · ');
  showKeys(r.ok ? 'ok' : 'err', `${r.short}.${each ? ` ${each}.` : ''}`);
});
$('dropKeys').addEventListener('click', async () => {
  await send('jobsSave', { patch: { groqKeys: [] } });
  showKeys('muted', 'Keys removed from this browser.');
  refresh();
});
$('rateNow').addEventListener('click', async () => {
  $('rateNow').disabled = true;
  const r = await send('jobsRateNow');
  showKeys(r.result.kind === 'started' ? 'ok' : 'warn', r.result.kind === 'started' ? 'Rating the jobs that wait; this page follows it.' : 'Busy: a finder run is on. It rates as it goes.');
  refresh();
});
$('saveModel').addEventListener('click', async () => {
  await send('jobsSave', { patch: { rateModel: $('rateModel').value.trim() } });
  showKeys('muted', `Model saved ${istHM(Date.now())}.`);
  refresh();
});
$('rateCalls').addEventListener('change', async (e) => { await send('jobsSave', { patch: { rateCalls: Number(e.target.value) } }); refresh(); });
$('saveLowPay').addEventListener('click', async () => {
  const names = $('lowPay').value.split(/\n|,/).map((x) => x.trim()).filter(Boolean);
  const s = await send('jobsSave', { patch: { lowPay: names } });
  $('lowPayOut').textContent = `Saved ${s.lowPay.names.length} companies ${istHM(Date.now())}. Press "Re-scan today" to apply it to jobs already decided.`;
});
$('resetLowPay').addEventListener('click', async () => {
  const s = await send('jobsSave', { patch: { lowPay: null } });
  $('lowPay').value = s.lowPay.names.join('\n');
  $('lowPayOut').textContent = `Back to the default list: ${s.lowPay.names.length} companies.`;
});
$('now').addEventListener('click', async () => { $('now').disabled = true; await send('jobsNow'); refresh(); });
$('rescan').addEventListener('click', async () => { await send('jobsRescan'); refresh(); });
$('startOver').addEventListener('click', async () => {
  const ok = window.confirm('Start over?\n\nYour site deletes every job the finder put there, on both lists (the radar\'s own openings stay).'
    + ' This browser forgets everything it read and reads every listing of the last 48 hours again, now, until it is done.'
    + ' Your other browser starts over at its next run. Ratings from the last 3 days are kept.');
  if (!ok) return;
  const o = $('startOut');
  o.hidden = false;
  o.className = 'out muted';
  o.textContent = 'Asking your site to delete the finder\'s jobs…';
  const r = await send('jobsStartOver');
  const res = r.result || {};
  o.className = `out ${res.kind === 'started' ? 'ok' : 'err'}`;
  o.textContent = res.kind === 'started'
    ? `Started over: your site deleted ${res.deleted} jobs. Reading every listing of the last 48 hours again; this page follows it. On your site, press Refresh in Openings.`
    : res.kind === 'busy' ? 'A run is on: try again when it ends.' : `Not started over: ${res.short}.`;
  refresh();
});
$('resume').addEventListener('click', async () => { await send('jobsResume'); refresh(); });

refresh();
setInterval(refresh, 2000);
