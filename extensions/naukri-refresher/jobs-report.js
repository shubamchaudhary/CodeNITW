// The job finder's report page: the funnel and every listing it judged (audit.js), with the JD it
// read and the rating's prompt and answer for the jobs it kept.
import { funnel } from './audit.js';

const ext = globalThis.browser ?? globalThis.chrome;
const $ = (id) => document.getElementById(id);
const send = (type, extra = {}) => ext.runtime.sendMessage({ type, ...extra });
const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text != null) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};

const PAGE = 100;
let all = [];
let shown = PAGE;
let open = null; // id of the expanded row
const filter = { outcome: 'all', reason: '', list: '', sort: 't', q: '' };

const inRange = () => {
  const cut = Date.now() - Number($('range').value) * 3_600_000;
  return all.filter((e) => (e.t || 0) >= cut);
};
const outcomeOf = (e) => (e.k ? 'kept' : e.stage === 'jd' ? 'jd' : 'card');
const when = (t) => new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

function matches(e) {
  if (filter.outcome !== 'all' && outcomeOf(e) !== filter.outcome) return false;
  if (filter.reason && (e.w || '') !== filter.reason) return false;
  if (filter.list && e.list !== filter.list) return false;
  const q = filter.q.trim().toLowerCase();
  return !q || `${e.title} ${e.company}`.toLowerCase().includes(q);
}

function renderFunnel(list) {
  const f = funnel(list);
  const box = $('funnel');
  box.replaceChildren();
  const stat = (n, label, on) => {
    const b = el('button', null, 'stat');
    b.type = 'button';
    b.append(el('b', n.toLocaleString()), el('span', label));
    b.addEventListener('click', on);
    box.append(b);
  };
  const go = (patch) => { Object.assign(filter, { outcome: 'all', reason: '', list: '' }, patch); syncControls(); render(); };
  stat(f.seen, 'distinct listings seen', () => go({}));
  stat(f.cardOut, 'left out on the card alone', () => go({ outcome: 'card' }));
  stat(f.jdOpened, 'job pages (JDs) opened', () => go({ outcome: 'jd' }));
  stat(f.jdOut, 'left out after reading the JD', () => go({ outcome: 'jd' }));
  stat(f.kept, `kept (${f.keptBackend} Backend, ${f.keptAi} AI)`, () => go({ outcome: 'kept' }));
  stat(f.sent, 'reached your site', () => go({ outcome: 'kept' }));
  stat(f.rated, 'rated by the LLM', () => go({ outcome: 'kept' }));
  const reasons = (id, pairs, outcome) => {
    const r = $(id);
    r.replaceChildren();
    if (!pairs.length) r.append(el('span', 'none', 'muted small'));
    for (const [why, n] of pairs) {
      const c = el('button', `${why} · ${n}`, 'chip');
      c.type = 'button';
      c.addEventListener('click', () => go({ outcome, reason: why }));
      r.append(c);
    }
  };
  reasons('cardReasons', f.cardReasons, 'card');
  reasons('jdReasons', f.jdReasons, 'jd');
  // The reason menu lists every reason there is.
  const sel = $('reason');
  const keep = sel.value;
  sel.replaceChildren(new Option('Any reason', ''));
  for (const [why] of [...f.cardReasons, ...f.jdReasons].sort((a, b) => b[1] - a[1])) if (![...sel.options].some((o) => o.value === why)) sel.append(new Option(why, why));
  sel.value = keep;
  return f;
}

function syncControls() {
  $('outcome').value = filter.outcome;
  $('reason').value = filter.reason;
  $('list').value = filter.list;
  $('sort').value = filter.sort;
  $('q').value = filter.q;
}

function decisionCell(e) {
  const td = el('td');
  if (e.k) td.append(el('span', e.sent ? '✓ kept, on your site' : '✓ kept', 'ok'));
  else td.append(el('span', `✗ ${e.w || 'left out'}`, 'err'), el('div', e.stage === 'jd' ? 'after reading its JD' : 'on the card', 'muted small'));
  return td;
}

async function detailRow(e, cols) {
  const tr = el('tr', null, 'detail');
  const td = el('td');
  td.colSpan = cols;
  tr.append(td);
  const lines = [
    `Judged ${when(e.t)} · ${e.stage === 'jd' ? 'its job page was opened' : 'decided on the card, its job page was not opened'}`,
    e.k ? 'Kept: ' + [e.list ? `${e.list === 'ai' ? 'AI' : 'Backend'} list` : '', e.rank != null ? `rank ${e.rank}` : '', e.apply === 'company' ? 'apply on the company site' : e.apply === 'naukri' ? 'apply on Naukri' : ''].filter(Boolean).join(' · ') : `Left out: ${e.w}`,
    e.total != null ? `Technologies its ${e.stage === 'jd' ? 'JD' : 'card'} asks for: ${e.have != null ? `${e.have} of ${e.total} are yours` : `${e.total} named`}${e.score != null ? ` (${e.score}% match)` : ''}` : null,
    e.ai != null ? `AI rating ${e.ai}${e.rel != null ? ` (the LLM's relevance ${e.rel})` : ''}${e.aiWhy ? ` — ${e.aiWhy}` : ''}` : e.k ? 'Not rated yet' : null,
    e.pay ? `Pay at about 2 years: ${e.pay.lo}–${e.pay.hi} LPA (${e.pay.from})` : null,
  ].filter(Boolean);
  for (const l of lines) td.append(el('div', l, 'small'));
  if (e.url) {
    const a = el('a', 'Open it on Naukri', 'small');
    a.href = e.url;
    a.target = '_blank';
    a.rel = 'noreferrer';
    td.append(a);
  }
  if (e.k || e.stage === 'jd') {
    const hold = el('div', 'Loading its JD and prompt…', 'muted small');
    td.append(hold);
    const { doc } = await send('jobsAuditDoc', { id: e.id });
    hold.remove();
    if (!doc) td.append(el('div', 'No JD or prompt kept for this one.', 'muted small'));
    if (doc && doc.jd) td.append(el('div', 'The JD the finder read', 'small muted'), el('pre', doc.jd));
    if (e.k && doc && doc.dbg) {
      td.append(el('div', `Prompt sent to ${doc.dbg.m || 'the model'} ${doc.dbg.exact ? '(includes the profile summary sent)' : '(résumé replaced by a note)'}`, 'small muted'), el('pre', doc.dbg.p));
      let out = doc.dbg.o;
      try { out = JSON.stringify(JSON.parse(out), null, 2); } catch { /* as it came */ }
      td.append(el('div', "The LLM's raw answer", 'small muted'), el('pre', out));
      if (doc.dbg.pay) td.append(el('div', 'Company pay lookup', 'small muted'), el('pre', doc.dbg.pay));
    } else if (doc && e.k) td.append(el('div', e.ai != null ? 'Rated before prompts were kept.' : 'Not rated yet: no prompt sent.', 'muted small'));
  }
  return tr;
}

async function render() {
  const list = inRange();
  const f = renderFunnel(list);
  let rows = list.filter(matches);
  const by = {
    t: (a, b) => (b.t || 0) - (a.t || 0),
    ai: (a, b) => (b.ai ?? -1) - (a.ai ?? -1) || (b.t || 0) - (a.t || 0),
    score: (a, b) => (b.score ?? -1) - (a.score ?? -1) || (b.t || 0) - (a.t || 0),
  }[filter.sort];
  rows = rows.sort(by);
  $('count').textContent = `${rows.length.toLocaleString()} of ${f.seen.toLocaleString()} listings`;
  const body = $('rows');
  body.replaceChildren();
  for (const e of rows.slice(0, shown)) {
    const tr = el('tr', null, 'job');
    tr.append(decisionCell(e));
    const t = el('td');
    t.append(el('div', e.title || '(no title)'));
    tr.append(t, el('td', e.company || ''), el('td', e.posted || '', 'hide-s'), el('td', e.exp || '', 'hide-s'), el('td', e.sal || '', 'hide-s'));
    tr.append(el('td', e.score != null ? `${e.have != null ? `${e.have}/${e.total} · ` : ''}${e.score}%` : '', 'num'), el('td', e.ai != null ? String(e.ai) : e.k ? '…' : '', 'num'), el('td', e.list === 'ai' ? 'AI' : e.list === 'backend' ? 'Backend' : ''));
    tr.addEventListener('click', async () => {
      const next = tr.nextElementSibling;
      if (next && next.classList.contains('detail')) { next.remove(); open = null; return; }
      body.querySelectorAll('tr.detail').forEach((d) => d.remove());
      open = e.id;
      tr.after(await detailRow(e, 9));
    });
    body.append(tr);
  }
  $('more').hidden = rows.length <= shown;
  $('more').textContent = `Show ${Math.min(PAGE, rows.length - shown)} more`;
  const sweepNote = '';
  $('status').textContent = list.length ? sweepNote : 'Nothing recorded yet: the report fills as the finder runs (it starts with the next run).';
}

async function load() {
  $('status').textContent = 'Loading…';
  const r = await send('jobsAudit');
  all = (r && r.entries) || [];
  shown = PAGE;
  await render();
}

function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

$('refresh').addEventListener('click', load);
$('range').addEventListener('change', () => { shown = PAGE; render(); });
$('more').addEventListener('click', () => { shown += PAGE; render(); });
for (const id of ['outcome', 'reason', 'list', 'sort']) $(id).addEventListener('change', () => { filter[id] = $(id).value; shown = PAGE; render(); });
$('q').addEventListener('input', () => { filter.q = $('q').value; shown = PAGE; render(); });
$('dlJson').addEventListener('click', async () => {
  const list = inRange();
  const out = [];
  for (const e of list) out.push(e.k || e.stage === 'jd' ? { ...e, ...(await send('jobsAuditDoc', { id: e.id })) } : e);
  download(`job-finder-report-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ funnel: funnel(list), listings: out }, null, 2), 'application/json');
});
$('dlCsv').addEventListener('click', () => {
  const cols = ['t', 'title', 'company', 'posted', 'exp', 'sal', 'stage', 'k', 'w', 'list', 'have', 'total', 'score', 'rank', 'ai', 'rel', 'apply', 'sent', 'url'];
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [cols.join(','), ...inRange().map((e) => cols.map((c) => cell(c === 't' ? new Date(e.t).toISOString() : e[c])).join(','))];
  download(`job-finder-report-${new Date().toISOString().slice(0, 10)}.csv`, lines.join('\n'), 'text/csv');
});

load();
setInterval(() => { if (!open) load(); }, 30_000); // follows a run that's going
