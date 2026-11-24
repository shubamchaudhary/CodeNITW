// A fake www.instahyre.com for the end-to-end tests of the Instahyre apply (instahyre.js), made to look
// like the real page in the owner's screenshots: a list of cards with "View job »" and "× Not
// interested", the count line ("Showing 1 - 5 out of N jobs"), a "Load more" under the list, and a
// job view with its experience badge, "Job Description", "Not interested" and "Apply".
// Modes: ok | login (redirects to /login) | limit (after 2 applies: "daily apply limit reached") |
// more (one job's Apply opens a question instead of applying).

export const INSTA_JOBS = () => [
  { id: 'j1', company: 'thinkify.io', title: 'Java Developer', badge: '2-4 Years', jd: 'Java, Spring Boot, MongoDB. Requirements: 2+ years of experience building backend services.', apply: true },
  { id: 'j2', company: 'Divisions Maintenance Group', title: 'Java Developer', badge: '2-5 Years', jd: 'Spring Boot and microservices. Requirements: 2 years of professional experience.', apply: true },
  { id: 'j3', company: 'Klimb.io', title: 'Java Developer', badge: '1-3 Years', jd: 'Spring Boot, MySQL. 1+ years of experience.', apply: true },
  { id: 'j4', company: 'Klimb.io', title: 'Java Developer', badge: '1-3 Years', jd: 'Spring Boot, MySQL. 1+ years of experience.', apply: true },
  { id: 'j5', company: 'Accenture', title: 'Java Developer', badge: '2-4 Years', jd: 'Java and Spring Boot. 2+ years of experience.', apply: false, why: 'low-pay' },
  { id: 'j6', company: 'Acme Labs', title: 'QA Automation Engineer', badge: '2-4 Years', jd: 'Selenium and Java. 2+ years of experience.', apply: false, why: 'QA' },
  { id: 'j7', company: 'Neander', title: 'Backend + AI Engineer', badge: '2-4 Years', jd: 'AI Engineering 80%. Requirements: 4-8 years of overall software engineering experience. Strong Python.', apply: false, why: '4+ years' },
  { id: 'j8', company: 'Zeta Systems', title: 'Backend Engineer', badge: '0-3 Years', jd: 'Java and Kafka. Requirements: 2 years of experience.', apply: true },
  { id: 'j9', company: 'Orbit Payments', title: 'Java Backend Developer', badge: '2-4 Years', jd: 'Spring Boot, PostgreSQL. 3 years of experience is a plus; 2 is enough.', apply: true },
  { id: 'j10', company: 'Nova Cloud', title: 'Software Engineer', badge: '1-3 Years', jd: 'Java and Redis. 1+ years of experience.', apply: true },
];

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>Instahyre</title>
<style>
 body{font:14px system-ui;margin:0;background:#fff;color:#222}
 #nav{background:#123;color:#fff;padding:12px 20px;display:flex;gap:24px}
 #nav b{background:#2c9;padding:2px 8px;border-radius:3px}
 .card{display:flex;gap:16px;border:1px solid #ddd;margin:12px 20px;padding:14px;border-radius:6px}
 .card h3{margin:0 0 6px;font-size:16px}
 .card .tags span{background:#eef;padding:2px 8px;margin-right:4px;border-radius:3px}
 .card button{background:#2a9;color:#fff;border:0;padding:8px 14px;border-radius:4px;cursor:pointer}
 .card .ni{color:#c33;display:block;margin-top:8px;cursor:pointer}
 [hidden]{display:none!important}
 #more{display:block;margin:16px auto;padding:10px 24px;cursor:pointer}
 #modal{position:fixed;left:5%;top:4%;width:90%;height:90%;background:#fff;border:1px solid #999;overflow:auto;padding:20px;z-index:10}
 #modal .x{position:absolute;right:14px;top:8px;font-size:22px;cursor:pointer}
 #modal button{padding:10px 24px;margin:8px;cursor:pointer}
 #modal .apply{background:#06b;color:#fff;border:0}
 #banner{background:#fee;padding:10px 20px}
</style></head><body>
<div id="nav"><b>GO PREMIUM</b><span>ACTIVITY</span><span>OPPORTUNITIES</span><span>INBOX</span></div>
<div id="banner" hidden></div>
<h2 id="count" style="text-align:center"></h2>
<button id="reveal" hidden>Search jobs</button>
<div id="searchBox"><div class="search-bar"><span id="chips"></span><input id="skill" aria-controls="choices"><button id="search">Search</button></div><ul id="choices"></ul></div>
<section><h4>Experience level</h4><input type="range" min="0" max="25" id="years" value="25"></section>
<button id="recommended">Recommended jobs</button><button id="results">Search Results</button>
<div id="list"></div>
<button id="more" hidden>Load more</button>
<div id="modal" hidden></div>
<script>
let jobs = [], shown = 5, mode = 'ok';
const $ = (id) => document.getElementById(id);
const post = (p, b) => fetch(p, { method: 'POST', body: JSON.stringify(b) }).then((r) => r.json());
const query = new URLSearchParams(location.search);
let selected = query.has('matching') ? ['Python'] : query.getAll('skills').flatMap(v => v.split(','));
let searching = query.get('search') === 'true';
const trap = { id: 'recommended', company: 'Wrong list', title: 'Java Developer', jd: 'Recommended job', badge: '1-2 Years' };
function renderFilters() {
  $('chips').replaceChildren();
  selected.forEach(s => {
    const chip = document.createElement('span'); chip.className = 'tag-item'; chip.textContent = s;
    const x = document.createElement('button'); x.className = 'remove-button'; x.textContent = '×';
    x.onclick = () => { selected = selected.filter(v => v !== s); renderFilters(); };
    chip.append(x); $('chips').append(chip);
  });
  $('recommended').className = searching ? '' : 'active'; $('results').className = searching ? 'active' : '';
}
$('years').value = query.get('years') || '25';
$('skill').oninput = () => {
  const text = $('skill').value;
  $('choices').replaceChildren();
  setTimeout(() => {
    if ($('skill').value !== text) return;
    for (const s of [text + 'Script', text]) {
      if (s === 'Unavailable') continue;
      const li = document.createElement('li'); li.setAttribute('role', 'option'); li.textContent = s;
      li.onclick = () => { selected.push(s); $('skill').value = ''; $('choices').replaceChildren(); renderFilters(); };
      $('choices').append(li);
    }
  }, 60);
};
$('search').onclick = async () => {
  const params = new URLSearchParams({ search: 'true', company_size: '0', job_type: '0', skills: selected.join(',') });
  if ($('years').value !== '25') params.set('years', $('years').value);
  await post('/__insta/search', { skills: selected, years: params.get('years') });
  if (mode !== 'stale') searching = true;
  history.replaceState(null, '', '?' + params);
  renderFilters();
  if (mode === 'slowResults') setTimeout(render, 1100);
  else render();
};
function render() {
  const list = $('list'); list.replaceChildren();
  const current = searching ? jobs : [trap];
  $('count').textContent = current.length ? 'Showing 1 - ' + Math.min(shown, current.length) + ' out of ' + current.length + ' jobs' : 'No matching opportunities found';
  current.slice(0, shown).forEach((j) => {
    const c = document.createElement('div'); c.className = 'card';
    c.innerHTML = '<div style="width:60px;height:40px;background:#eee"></div><div style="flex:1"><h3></h3><div class="tags"><span>Bangalore</span><span>Founded in 2018</span></div><p></p><div class="tags"><span>Java</span><span>Spring Boot</span></div></div><div><button class="v">View job »</button><span class="ni">✕ Not interested</span></div>';
    c.querySelector('h3').textContent = j.company + ' - ' + j.title;
    c.querySelector('p').textContent = j.company + ' builds software for clients.';
    c.querySelector('.v').onclick = () => open(j);
    c.querySelector('.ni').onclick = () => post('/__insta/notinterested', { id: j.id });
    list.append(c);
  });
  $('more').hidden = current.length <= shown;
}
function open(j) {
  if (mode === 'drift') { searching = false; history.replaceState(null, '', '?matching=true'); renderFilters(); }
  const m = $('modal'); m.hidden = false; m.replaceChildren();
  m.innerHTML = '<span class="x" aria-label="Close">×</span><div style="display:flex;gap:20px"><div style="width:220px">Your InstaMatch score LOW<br>Company at a Glance</div><div style="flex:1"><h2></h2><div class="co"></div><span class="badge" style="background:#def;padding:2px 8px"></span><h4>Job Description</h4><p class="jd"></p><div class="extra"></div></div></div><div><button class="ni2">Not interested</button><button class="apply">Apply</button></div>';
  m.querySelector('h2').textContent = j.title; m.querySelector('.co').textContent = j.company; m.querySelector('.badge').textContent = j.badge;
  m.querySelector('.jd').textContent = j.jd + ' Function: Software Engineering. Build and maintain scalable backend services, APIs and databases with the team every day.';
  m.querySelector('.x').onclick = () => { m.hidden = true; };
  m.querySelector('.ni2').onclick = () => post('/__insta/notinterested', { id: j.id });
  m.querySelector('.apply').onclick = async () => {
    const r = await post('/__insta/apply', { id: j.id });
    if (r.more) { m.querySelector('.extra').textContent = 'Please answer: what is your notice period? (required)'; return; }
    if (r.limit) { $('banner').hidden = false; $('banner').textContent = 'Your daily apply limit has been reached. Upgrade to apply more.'; return; }
    jobs = jobs.filter((x) => x.id !== j.id); m.hidden = true; render();
  };
}
$('more').onclick = () => { shown += 5; render(); };
$('reveal').onclick = () => { $('reveal').hidden = true; $('searchBox').hidden = false; };
fetch('/__insta/state').then((r) => r.json()).then((s) => {
  jobs = s.jobs; mode = s.mode; renderFilters(); render();
  if (mode === 'lateRedirect') {
    const redirect = new MutationObserver(() => {
      redirect.disconnect();
      history.replaceState(null, '', '?matching=true'); searching = false; selected = ['Python'];
      $('searchBox').hidden = true; $('reveal').hidden = false;
      renderFilters(); render();
    });
    redirect.observe($('list'), { attributes: true, subtree: true, attributeFilter: ['data-nr-view'] });
  }
});
</script></body></html>`;

const LOGIN = '<!doctype html><title>Instahyre login</title><h1>Log in to Instahyre</h1><p>Sign in to continue</p>';

/** The fake site: pages, and the calls the page makes. `st` is { mode, jobs, applies, notInterested, needsMore, limitAfter, format }. `format`: which way of writing several skills in a link it understands: 'any' | 'repeat' (skills=a&skills=b) | 'comma' (skills=a,b). */
export function instahyreApi(req, res, url, body, st) {
  const send = (code, payload, type = 'text/html; charset=utf-8', headers = {}) => {
    res.writeHead(code, { 'content-type': type, ...headers });
    res.end(typeof payload === 'string' ? payload : JSON.stringify(payload));
  };
  if (url.pathname === '/__insta/state') return send(200, { jobs: st.jobs, mode: st.mode }, 'application/json');
  if (url.pathname === '/__insta/search') { st.searches.push(JSON.parse(body)); return send(200, {}, 'application/json'); }
  if (url.pathname === '/__insta/apply' && req.method === 'POST') {
    const id = JSON.parse(body || '{}').id;
    st.attempts.push(id);
    if (st.mode === 'more' && id === st.needsMore) return send(200, { more: true }, 'application/json');
    if (st.mode === 'limit' && st.applies.length >= st.limitAfter) return send(200, { limit: true }, 'application/json');
    const j = st.jobs.find((x) => x.id === id);
    if (j) { st.applies.push({ id, company: j.company, title: j.title }); st.jobs = st.jobs.filter((x) => x.id !== id); }
    return send(200, { ok: true }, 'application/json');
  }
  if (url.pathname === '/__insta/notinterested' && req.method === 'POST') {
    st.notInterested.push(JSON.parse(body || '{}').id);
    return send(200, { ok: true }, 'application/json');
  }
  if (url.pathname === '/login') return send(200, LOGIN);
  // A copied search may land on Recommended jobs, including a real-looking card with Apply.
  if (url.pathname.startsWith('/candidate/opportunities')) {
    if (url.searchParams.get('matching') === 'true') return send(200, PAGE);
    const sk = url.searchParams.getAll('skills');
    const comma = sk.some((x) => x.includes(','));
    if (st.format === 'redirect' || (st.format === 'comma' && sk.length > 1) || (st.format === 'repeat' && comma)) return send(302, '', 'text/html', { location: '/candidate/opportunities/?matching=true' });
  }
  if (st.mode === 'login') return send(302, '', 'text/html', { location: '/login' });
  return send(200, PAGE);
}
