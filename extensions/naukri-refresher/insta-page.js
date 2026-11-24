// The Instahyre apply page: two start buttons, the skip rules, limits, links, and what it did.
import { savedSearch } from './instahyre-rules.js';
const ext = globalThis.browser ?? globalThis.chrome;
const $ = (id) => document.getElementById(id);
const send = (type, extra = {}) => ext.runtime.sendMessage({ type, ...extra });
const MATCH = 'https://www.instahyre.com/*';
const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text != null) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
const when = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

let loaded = false;

function render(s) {
  const st = s.state;
  const cfg = s.cfg;
  if (!loaded) {
    $('urlJava').value = cfg.urlJava;
    $('urlAi').value = cfg.urlAi;
    $('maxRun').value = cfg.maxRun;
    $('maxDay').value = cfg.maxDay;
    $('skipRules').checked = cfg.skipRules;
    $('dry').checked = cfg.dry;
    loaded = true;
  }
  $('java').disabled = st.running;
  $('ai').disabled = st.running;
  $('stop').hidden = !st.running;
  const line = $('status');
  if (st.running) {
    line.className = 'small ok';
    line.textContent = `Running (${st.kind === 'ai' ? 'GenAI' : 'Java backend'}${st.dry ? ', dry run' : ''}): ${st.applied} applied, ${st.skipped} skipped so far, ${st.dayApplied} applied today.`;
  } else if (st.note) {
    line.className = 'small warn';
    line.textContent = `${st.note} (${st.dayApplied} applied today)`;
  } else {
    line.className = 'small muted';
    line.textContent = s.access ? 'Not running.' : 'No access to instahyre.com yet: it asks when you start.';
  }
  $('counts').textContent = `${st.log.filter((e) => e.action === 'applied').length} applied · ${st.log.filter((e) => e.action === 'skipped').length} skipped · ${st.log.filter((e) => e.action === 'dry').length} dry-run (last ${st.log.length})`;
  const body = $('log');
  body.replaceChildren();
  for (const e of [...st.log].reverse().slice(0, 150)) {
    const tr = el('tr');
    const res = e.action === 'applied' ? el('td', '✓ applied', 'ok') : e.action === 'dry' ? el('td', '○ would apply', 'muted') : e.action === 'stopped' ? el('td', `✗ ${e.why}`, 'err') : el('td', `skipped: ${e.why}`, 'muted');
    tr.append(el('td', when(e.t)), el('td', e.title || ''), el('td', e.company || ''), el('td', e.yrs != null ? `${e.yrs}+` : ''), res);
    body.append(tr);
  }
}

async function refresh() { render(await send('instaStatus')); }

async function start(kind) {
  // Firefox asks for the site on a click; Chrome has it already.
  const ok = await ext.permissions.contains({ origins: [MATCH] }).catch(() => false) || await ext.permissions.request({ origins: [MATCH] }).catch(() => false);
  if (!ok) { $('status').className = 'small err'; $('status').textContent = 'instahyre.com access was not allowed.'; return; }
  // Save what's on the page first (the dry run and skip boxes), so the run uses them.
  await send('instaSave', { patch: { skipRules: $('skipRules').checked, dry: $('dry').checked } });
  const r = await send('instaStart', { kind });
  if (r.result && r.result.kind !== 'started') { $('status').className = 'small err'; $('status').textContent = r.result.short || 'A run is already going.'; }
  refresh();
}

$('java').addEventListener('click', () => start('java'));
$('ai').addEventListener('click', () => start('ai'));
$('stop').addEventListener('click', async () => { await send('instaStop'); refresh(); });
$('skipRules').addEventListener('change', () => send('instaSave', { patch: { skipRules: $('skipRules').checked } }));
$('dry').addEventListener('change', () => send('instaSave', { patch: { dry: $('dry').checked } }));
$('saveLimits').addEventListener('click', async () => {
  const s = await send('instaSave', { patch: { maxRun: Number($('maxRun').value), maxDay: Number($('maxDay').value) } });
  $('maxRun').value = s.cfg.maxRun;
  $('maxDay').value = s.cfg.maxDay;
  $('limitsOut').textContent = 'Saved.';
});
$('saveUrls').addEventListener('click', async () => {
  const patch = { urlJava: $('urlJava').value.trim(), urlAi: $('urlAi').value.trim() };
  for (const [id, link] of Object.entries(patch)) {
    try { savedSearch(link); } catch {
      $('urlsOut').textContent = `For ${id === 'urlJava' ? 'Java backend' : 'GenAI'}, paste the Search Results link with the selected skills.`;
      $(id).focus();
      return;
    }
  }
  const s = await send('instaSave', { patch });
  $('urlJava').value = s.cfg.urlJava;
  $('urlAi').value = s.cfg.urlAi;
  $('urlsOut').textContent = 'Saved.';
});
$('resetUrls').addEventListener('click', async () => {
  const d = (await send('instaStatus')).defaults;
  const s = await send('instaSave', { patch: { urlJava: d.urlJava, urlAi: d.urlAi } });
  $('urlJava').value = s.cfg.urlJava;
  $('urlAi').value = s.cfg.urlAi;
  $('urlsOut').textContent = 'Back to the defaults.';
});
$('clear').addEventListener('click', async () => { render(await send('instaClearLog')); });

refresh();
setInterval(refresh, 2000);
