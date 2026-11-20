import { NAUKRI_MATCH, DAY, fmtWhen, istHM, istDayKey } from './lib.js';
import { RADAR_API_MATCH, SITE_JOBS_URL } from './jobs-lib.js';

const ext = globalThis.browser ?? globalThis.chrome;
const $ = (id) => document.getElementById(id);
const send = (type, extra = {}) => ext.runtime.sendMessage({ type, ...extra });
let busyAction = false;

for (const id of ['start', 'end']) {
  for (let h = 0; h < 24; h++) $(id).add(new Option(`${String(h).padStart(2, '0')}:00`, String(h)));
}

const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text != null) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};

/** "Backend Softw…Immediate Joiner" + the trailing dot (highlighted) exactly as Naukri returned it. */
function renderHeadlineNow(now, s) {
  const dd = $('now');
  dd.replaceChildren();
  const h = s.headlineNow;
  if (!h || !h.text) { dd.textContent = '—'; dd.title = ''; return; }
  const dot = h.text.endsWith('.');
  const body = dot ? h.text.slice(0, -1) : h.text;
  const short = body.length > 30 ? `${body.slice(0, 12).trimEnd()}…${body.slice(-15).trimStart()}` : body;
  dd.append(short);
  if (dot) dd.append(el('span', '.', 'tail-dot'));
  else dd.append(el('span', ' (no dot)', 'muted'));
  dd.append(el('span', istHM(h.t), 'when'));
  dd.title = `As Naukri returned it at ${fmtWhen(h.t, now)} IST:\n${h.text}`;
}

function historyRow(e) {
  const li = el('li');
  let icon = '·';
  let cls = 'i-info';
  let text = '';
  let meta = '';
  let title = '';
  if (e.type === 'save') {
    icon = e.confirmed ? '✓' : '?';
    cls = e.confirmed ? 'i-ok' : 'i-warn';
    text = `${e.action} "."${e.src === 'manual' ? ' · manual' : ''}`;
    if (!e.confirmed) {
      meta = 'not confirmed';
      title = 'Naukri accepted the save, but re-reading the profile afterwards failed.';
    } else if (e.naukriAt) {
      meta = `Naukri ${istHM(e.naukriAt)}`;
      title = "Confirmed by re-reading your profile from Naukri; the time is Naukri's own last-modified time.";
    } else {
      meta = 'confirmed';
      title = 'Confirmed by re-reading your profile from Naukri after the save.';
    }
  } else if (e.type === 'fail') {
    icon = '✗';
    cls = 'i-err';
    text = e.reason;
    meta = e.retryAt ? `retry ${istHM(e.retryAt)}` : e.note || '';
  } else if (e.type === 'skip') {
    icon = '–';
    text = `skipped: ${e.reason}`;
  } else if (e.type === 'pause') {
    icon = '!';
    cls = 'i-err';
    text = `paused: ${e.reason}`;
  }
  li.append(el('time', istHM(e.t)), el('span', icon, cls), el('span', text), el('span', meta, 'meta'));
  if (title) li.title = title;
  return li;
}

function renderHistory(s, now) {
  const root = $('history');
  root.replaceChildren();
  for (const [key, label] of [[istDayKey(now), 'Today'], [istDayKey(now - DAY), 'Yesterday']]) {
    const items = s.history.filter((e) => istDayKey(e.t) === key);
    const saves = items.filter((e) => e.type === 'save').length;
    const h = el('h2');
    h.append(el('span', label), el('span', `${saves} ${saves === 1 ? 'save' : 'saves'}`));
    root.append(h);
    if (!items.length) {
      root.append(el('p', 'Nothing yet.', 'muted small empty'));
      continue;
    }
    const ul = el('ul', null, 'hist');
    for (const e of items) ul.append(historyRow(e));
    root.append(ul);
  }
}

function render(s) {
  if (!s || s.error) {
    $('headline').textContent = 'Not responding';
    $('detail').hidden = false;
    $('detail').textContent = s && s.error ? s.error : 'Reopen this popup.';
    return;
  }
  const now = Date.now();
  $('version').textContent = `v${s.version}`;
  $('access').hidden = s.access;

  const card = $('state');
  card.className = 'card';
  card.title = '';
  $('resume').hidden = true;
  $('detail').hidden = true;
  if (s.running) {
    card.classList.add('busy');
    $('headline').textContent = 'Refreshing…';
  } else if (s.halted) {
    card.classList.add('bad');
    $('headline').textContent = `Paused · ${s.halted.short || 'see Details'}`;
    $('detail').hidden = false;
    $('detail').textContent = s.halted.kind === 'auth' ? 'Log in to naukri.com here, then Resume.' : 'See Details below, then Resume.';
    card.title = s.halted.reason;
    $('resume').hidden = false;
  } else if (!s.settings.enabled) {
    card.classList.add('off');
    $('headline').textContent = 'Off';
  } else if (!s.verified) {
    $('headline').textContent = 'Press Refresh now once to start';
  } else if (s.plan) {
    $('headline').textContent = `On · next ${fmtWhen(s.plan.at, now)} IST`;
    if (s.plan.attempts > 0) {
      $('detail').hidden = false;
      $('detail').textContent = `retry ${s.plan.attempts + 1} of 3`;
    }
  } else {
    $('headline').textContent = 'On';
  }

  $('account').textContent = s.account ? (s.account.name || `profile …${s.account.idTail}`) : '—';
  renderHeadlineNow(now, s);
  $('today').textContent = `${s.writesToday} / ${s.dailyCap}`;

  $('enabled').checked = s.settings.enabled;
  $('weekends').checked = s.settings.skipWeekends;
  $('keepAwake').checked = s.settings.keepAwake;
  $('awake-row').hidden = !s.keepAwake.available;
  $('start').value = String(s.settings.startHour);
  $('end').value = String(s.settings.endHour);
  for (const id of ['run', 'check']) $(id).disabled = busyAction || s.running || !s.access;

  renderHistory(s, now);

  $('backup-link').hidden = !s.backup;
  const log = $('log');
  log.replaceChildren();
  for (const e of s.log.slice(0, 40)) {
    const li = el('li');
    li.append(el('time', fmtWhen(e.t, now)), e.msg);
    log.append(li);
  }
}

function showResult(r) {
  const out = $('result');
  if (!r) { out.hidden = true; return; }
  out.hidden = false;
  let cls = 'err';
  let text;
  if (r.kind === 'ok' && r.dry) {
    cls = 'ok';
    text = `Connected as ${(r.account && r.account.name) || 'your account'}. Nothing changed.`;
  } else if (r.kind === 'ok') {
    cls = r.unverified ? 'warn' : 'ok';
    text = `Done: ${r.action} ".", ${r.unverified ? 'not confirmed' : 'confirmed on Naukri'}.`;
  } else if (r.kind === 'skipped' || r.kind === 'busy') {
    cls = 'warn';
    text = r.kind === 'busy' ? 'Already running.' : `Not refreshed: ${r.short}.`;
  } else {
    cls = r.kind === 'transient' || r.kind === 'ratelimit' ? 'warn' : 'err';
    text = `Failed: ${r.short || r.kind}.`;
  }
  out.className = `result ${cls}`;
  out.textContent = text;
}

/** The job finder's one-line status. */
function renderJobs(j) {
  const line = $('jobsLine');
  if (!j || j.error) { line.textContent = 'Job finder not responding.'; line.className = 'small bad'; return; }
  const now = Date.now();
  const kept = (j.daily && j.daily.kept) || {};
  const today = `${kept.backend || 0} Backend · ${kept.ai || 0} AI today`;
  $('jobsEnabled').checked = j.settings.enabled;
  if (document.activeElement !== $('jobsScope')) $('jobsScope').value = j.settings.scope || 'both';
  const needsAccess = !j.access.naukri || !j.access.site;
  const rejected = !!(j.halted && j.halted.short === 'site token rejected');
  const connect = !needsAccess && (!j.settings.hasToken || rejected);
  $('jobsResume').hidden = !j.halted || connect;
  $('jobsAllow').hidden = !needsAccess;
  $('jobsConnect').hidden = !connect;
  $('jobsNow').hidden = !!j.halted || needsAccess || connect;
  $('jobsNow').disabled = j.running || !j.settings.hasToken;
  let cls = 'small muted';
  let text;
  if (needsAccess) { cls = 'small warn'; text = 'Needs access to naukri.com and your site.'; }
  else if (connect) { cls = 'small warn'; text = rejected ? 'Your site turned the token down: connect again.' : 'Not connected to your site yet.'; }
  else if (j.running) { cls = 'small ok'; text = `Finding jobs… ${(j.daily && j.daily.pages) || 0} pages read today`; }
  else if (j.halted) { cls = 'small bad'; text = `Paused · ${j.halted.short}`; line.title = j.halted.msg || ''; }
  else if (!j.settings.enabled) { text = `Off · ${today}`; }
  else { cls = 'small ok'; text = `${today}${j.plan ? ` · next ${fmtWhen(j.plan.at, now)}` : ''}`; }
  if (!j.halted) line.title = j.lastRun ? `Last run ${fmtWhen(j.lastRun.t, now)} IST: ${j.lastRun.pages || 0} pages, ${j.lastRun.kept || 0} kept${j.lastRun.note ? ` (${j.lastRun.note})` : ''}` : '';
  line.className = cls;
  line.textContent = text;
}

async function refreshView() {
  try { render(await send('status')); } catch (e) { render({ error: e.message }); }
  try { renderJobs(await send('jobsStatus')); } catch (e) { renderJobs({ error: e.message }); }
}

async function act(type, extra) {
  busyAction = true;
  for (const id of ['run', 'check']) $(id).disabled = true;
  try {
    const out = await send(type, extra);
    if (out && out.result) showResult(out.result);
    render(out && out.status ? out.status : out);
  } catch (e) {
    showResult({ kind: 'err', short: e.message });
  } finally {
    busyAction = false;
    refreshView();
  }
}

$('enabled').addEventListener('change', (e) => act('saveSettings', { patch: { enabled: e.target.checked } }));
$('weekends').addEventListener('change', (e) => act('saveSettings', { patch: { skipWeekends: e.target.checked } }));
$('keepAwake').addEventListener('change', (e) => act('saveSettings', { patch: { keepAwake: e.target.checked } }));
$('start').addEventListener('change', (e) => {
  const v = Number(e.target.value);
  const patch = { startHour: v };
  if (Number($('end').value) < v) patch.endHour = v;
  act('saveSettings', { patch });
});
$('end').addEventListener('change', (e) => {
  const v = Number(e.target.value);
  const patch = { endHour: v };
  if (Number($('start').value) > v) patch.startHour = v;
  act('saveSettings', { patch });
});
$('run').addEventListener('click', () => act('runNow'));
$('check').addEventListener('click', () => act('check'));
$('resume').addEventListener('click', () => act('resume'));
$('backup-link').addEventListener('click', (e) => {
  e.preventDefault();
  ext.tabs.create({ url: ext.runtime.getURL('backup.html') });
});
$('grant').addEventListener('click', async () => {
  try { await ext.permissions.request({ origins: [NAUKRI_MATCH] }); } catch { /* user declined */ }
  refreshView();
});

$('jobsEnabled').addEventListener('change', async (e) => {
  await send('jobsSave', { patch: { enabled: e.target.checked } }).catch(() => {});
  refreshView();
});
$('jobsNow').addEventListener('click', async () => {
  $('jobsNow').disabled = true;
  await send('jobsNow').catch(() => {});
  refreshView();
});
$('jobsResume').addEventListener('click', async () => {
  await send('jobsResume').catch(() => {});
  refreshView();
});
$('jobsAllow').addEventListener('click', async () => {
  try { await ext.permissions.request({ origins: [NAUKRI_MATCH, RADAR_API_MATCH] }); } catch { /* user declined */ }
  refreshView();
});
$('jobsScope').addEventListener('change', async (e) => {
  await send('jobsSave', { patch: { scope: e.target.value } }).catch(() => {});
  refreshView();
});
$('jobsConnect').addEventListener('click', () => ext.tabs.create({ url: SITE_JOBS_URL, active: true }));
$('jobsSettings').addEventListener('click', () => ext.tabs.create({ url: ext.runtime.getURL('jobs.html') }));

refreshView();
setInterval(() => { if (!busyAction) refreshView(); }, 1500);
