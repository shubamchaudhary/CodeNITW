// End-to-end test: loads the real extension into headless Chrome, Edge and Firefox (temporary
// profiles, audio muted), points www.naukri.com at a local mock, and drives every path:
// schedule, check, refresh via a background tab and via an open tab, retries, 429 backoff,
// logout, API changes, daily cap, concurrency, on/off.
//
// Run: node extensions/naukri-refresher-dev/e2e.mjs [chrome|edge|firefox ...]
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { startMock, EXPECT, RADAR_TOKEN, GROQ_KEYS, TEST_RESUME, listing, fixtures } from './mock-naukri.mjs';
import { istHM, MIN, HOUR, DAY } from '../naukri-refresher/lib.js';

const EXT_DIR = fileURLToPath(new URL('../naukri-refresher', import.meta.url));
const EXE = {
  chrome: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  edge: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  firefox: 'C:/Program Files/Mozilla Firefox/firefox.exe',
};
const OPENSSL = process.env.OPENSSL || 'C:/Program Files/Git/mingw64/bin/openssl.exe';
const FX_ID = 'naukri-refresher@local';
const FX_UUID = '6c1a8f8e-0d5b-4b7e-9a51-3f2e4c7d9b10';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const withTimeout = (p, ms, what) => {
  let t;
  return Promise.race([p, new Promise((_, no) => { t = setTimeout(() => no(new Error(`timeout: ${what}`)), ms); })]).finally(() => clearTimeout(t));
};
const wrap = (expr) => `(async () => { const X = globalThis.browser ?? globalThis.chrome; return JSON.stringify(await (${expr})); })()`;

function waitExit(proc, ms) {
  return new Promise((ok) => {
    if (proc.exitCode !== null) return ok();
    const t = setTimeout(() => { try { proc.kill(); } catch { /* gone */ } ok(); }, ms);
    proc.once('exit', () => { clearTimeout(t); ok(); });
  });
}

// ---------------------------------------------------------------- Chrome / Edge (CDP over a pipe)

class PipeCDP {
  constructor(proc) {
    this.seq = 0;
    this.wait = new Map();
    this.buf = Buffer.alloc(0);
    this.out = proc.stdio[3];
    proc.stdio[4].on('data', (d) => {
      this.buf = Buffer.concat([this.buf, d]);
      let i;
      while ((i = this.buf.indexOf(0)) >= 0) {
        const m = JSON.parse(this.buf.subarray(0, i).toString('utf8'));
        this.buf = this.buf.subarray(i + 1);
        const w = m.id && this.wait.get(m.id);
        if (w) { this.wait.delete(m.id); m.error ? w.no(new Error(`${m.error.message} ${m.error.data || ''}`)) : w.ok(m.result); }
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.seq;
    const p = new Promise((ok, no) => this.wait.set(id, { ok, no }));
    this.out.write(`${JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params })}\0`);
    return withTimeout(p, 90_000, method);
  }
}

// Edge's msedge.exe relaunches itself, which loses the pipe, so Edge is driven over its port.
class WsCDP {
  constructor(ws) {
    this.seq = 0;
    this.wait = new Map();
    this.ws = ws;
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      const w = m.id && this.wait.get(m.id);
      if (w) { this.wait.delete(m.id); m.error ? w.no(new Error(`${m.error.message} ${m.error.data || ''}`)) : w.ok(m.result); }
    };
  }
  send(method, params = {}, sessionId) {
    const id = ++this.seq;
    const p = new Promise((ok, no) => this.wait.set(id, { ok, no }));
    this.ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
    return withTimeout(p, 90_000, method);
  }
}

async function chromium(name, tmp) {
  const profile = join(tmp, `${name}-profile`);
  const common = [
    '--headless', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
    '--mute-audio', '--disable-sync', '--disable-background-networking', '--disable-component-update',
    '--host-resolver-rules=MAP www.naukri.com 127.0.0.1,MAP interviewplanprep.vercel.app 127.0.0.1,MAP api.groq.com 127.0.0.1,MAP www.instahyre.com 127.0.0.1', '--ignore-certificate-errors',
  ];
  let cdp;
  let proc;
  let errs = '';
  if (name === 'edge') {
    proc = spawn(EXE[name], ['--remote-debugging-port=0', `--disable-extensions-except=${EXT_DIR}`, `--load-extension=${EXT_DIR}`, ...common, 'about:blank'], { stdio: 'ignore' });
    const portFile = join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 150 && !existsSync(portFile); i++) await sleep(100);
    await sleep(300);
    const [port, path] = readFileSync(portFile, 'utf8').split('\n');
    const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
    await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error('Edge DevTools connect failed')); });
    cdp = new WsCDP(ws);
  } else {
    proc = spawn(EXE[name], ['--remote-debugging-pipe', '--enable-unsafe-extension-debugging', ...common, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
    proc.stderr.on('data', (d) => { errs = (errs + d).slice(-3000); });
    cdp = new PipeCDP(proc);
  }
  const { product } = await cdp.send('Browser.getVersion');
  await cdp.send('Security.setIgnoreCertificateErrors', { ignore: true }).catch(() => {});
  const { id } = await cdp.send('Extensions.loadUnpacked', { path: EXT_DIR });
  const { targetId } = await cdp.send('Target.createTarget', { url: `chrome-extension://${id}/popup.html` });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const evalExt = async (expr) => {
    const r = await cdp.send('Runtime.evaluate', { expression: wrap(expr), awaitPromise: true, returnByValue: true }, sessionId);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value === undefined ? undefined : JSON.parse(r.result.value);
  };
  // Wait until the target really is the extension page (Chrome may first report a plain page).
  let ready = false;
  for (let i = 0; i < 150 && !ready; i++) {
    try { ready = await evalExt("document.readyState === 'complete' && !!(X && X.runtime && X.runtime.id && X.alarms)"); } catch { /* loading */ }
    if (!ready) await sleep(100);
  }
  if (!ready) throw new Error('extension page never became ready');
  return {
    name, version: product, evalExt,
    msg: (m) => evalExt(`X.runtime.sendMessage(${JSON.stringify(m)})`),
    async openNaukriTab() {
      const t = await cdp.send('Target.createTarget', { url: 'https://www.naukri.com/mnjuser/profile', background: true });
      await sleep(2000);
      return t.targetId;
    },
    async openTab(url) {
      const t = await cdp.send('Target.createTarget', { url, background: true });
      return t.targetId;
    },
    closeTab: (t) => cdp.send('Target.closeTarget', { targetId: t }),
    async screenshot(file) {
      const h = await evalExt('document.documentElement.scrollHeight');
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: 358, height: h, deviceScaleFactor: 2, mobile: false }, sessionId);
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
      writeFileSync(file, Buffer.from(data, 'base64'));
    },
    async freezeTab(targetId, frozen) {
      const { sessionId: s } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
      await cdp.send('Page.setWebLifecycleState', { state: frozen ? 'frozen' : 'active' }, s);
    },
    async naukriTabs() {
      const { targetInfos } = await cdp.send('Target.getTargets');
      return targetInfos.filter((t) => t.type === 'page' && t.url.startsWith('https://www.naukri.com')).map((t) => t.url);
    },
    async close() {
      await cdp.send('Browser.close').catch(() => {});
      await waitExit(proc, 8000);
      if (name === 'edge') killByProfile('msedge.exe', profile);
    },
    logs: () => errs,
  };
}

// Last-resort cleanup that can only ever hit the test's own browser (matched by its temp profile).
function killByProfile(image, profile) {
  const needle = profile.replace(/'/g, "''");
  spawnSync('powershell', ['-NoProfile', '-Command',
    `Get-CimInstance Win32_Process -Filter "Name='${image}'" | Where-Object { $_.CommandLine -like '*${needle}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`]);
}

// ---------------------------------------------------------------- Firefox (WebDriver BiDi)

async function firefox(tmp) {
  const profile = join(tmp, 'firefox-profile');
  mkdirSync(profile, { recursive: true });
  const prefs = {
    'network.dns.localDomains': 'www.naukri.com,interviewplanprep.vercel.app,api.groq.com,www.instahyre.com',
    'network.trr.mode': 5,
    'extensions.webextensions.uuids': JSON.stringify({ [FX_ID]: FX_UUID }),
    'extensions.originControls.grantByDefault': true,
    'media.volume_scale': '0.0',
    'browser.shell.checkDefaultBrowser': false,
    'datareporting.policy.dataSubmissionEnabled': false,
    'toolkit.telemetry.reportingpolicy.firstRun': false,
    'app.update.disabledForTesting': true,
    'browser.safebrowsing.malware.enabled': false,
    'browser.safebrowsing.phishing.enabled': false,
  };
  writeFileSync(join(profile, 'user.js'), Object.entries(prefs).map(([k, v]) => `user_pref(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join('\n'));
  const port = 9300 + Math.floor(Math.random() * 600);
  // System access lets BiDi evaluate inside the extension's own page (throwaway test profile only).
  const proc = spawn(EXE.firefox, ['--headless', '--no-remote', '--profile', profile, `--remote-debugging-port=${port}`], {
    stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, MOZ_REMOTE_ALLOW_SYSTEM_ACCESS: '1' },
  });
  let out = '';
  const grab = (d) => { out = (out + d).slice(-6000); };
  proc.stdout.on('data', grab);
  proc.stderr.on('data', grab);
  for (let i = 0; i < 150 && !/WebDriver BiDi listening/.test(out); i++) await sleep(200);
  const ws = new WebSocket(`ws://127.0.0.1:${port}/session`);
  await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error(`BiDi connect failed\n${out}`)); });
  let seq = 0;
  const wait = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    const w = m.id && wait.get(m.id);
    if (w) { wait.delete(m.id); m.type === 'error' ? w.no(new Error(`${m.error}: ${m.message}`)) : w.ok(m.result); }
  };
  const send = (method, params = {}) => {
    const id = ++seq;
    ws.send(JSON.stringify({ id, method, params }));
    return withTimeout(new Promise((ok, no) => wait.set(id, { ok, no })), 90_000, method);
  };
  const sess = await send('session.new', { capabilities: { alwaysMatch: { acceptInsecureCerts: true } } });
  // BiDi may not navigate to extension pages, so a TEST COPY of the extension opens its own
  // popup.html in a tab on install. The real extension folder is not modified.
  const copy = join(tmp, 'ext-firefox-test');
  cpSync(EXT_DIR, copy, { recursive: true, filter: (src) => !src.endsWith('resume.local.json') }); // never your real resume
  const manifest = JSON.parse(readFileSync(join(copy, 'manifest.json'), 'utf8'));
  manifest.background.scripts = [...manifest.background.scripts, 'test-open-popup.js'];
  writeFileSync(join(copy, 'manifest.json'), JSON.stringify(manifest, null, 2));
  writeFileSync(join(copy, 'test-open-popup.js'),
    "const e = globalThis.browser; e.runtime.onInstalled.addListener(() => e.tabs.create({ url: e.runtime.getURL('popup.html') }));\n");
  await send('webExtension.install', { extensionData: { type: 'path', path: copy } });
  let ctx = null;
  for (let i = 0; i < 100 && !ctx; i++) {
    const { contexts } = await send('browsingContext.getTree', {});
    const c = contexts.find((x) => x.url.startsWith(`moz-extension://${FX_UUID}/popup.html`));
    if (c) ctx = c.context;
    else await sleep(100);
  }
  if (!ctx) throw new Error(`popup tab never appeared\n${out.slice(-1500)}`);
  const evalExt = async (expr) => {
    const r = await send('script.evaluate', { expression: wrap(expr), target: { context: ctx }, awaitPromise: true });
    if (r.type === 'exception') throw new Error(r.exceptionDetails?.text || 'exception');
    return r.result && r.result.value !== undefined ? JSON.parse(r.result.value) : undefined;
  };
  return {
    name: 'firefox', version: `Firefox ${sess.capabilities.browserVersion}`, evalExt,
    msg: (m) => evalExt(`X.runtime.sendMessage(${JSON.stringify(m)})`),
    async openNaukriTab() {
      const { context } = await send('browsingContext.create', { type: 'tab', background: true });
      await send('browsingContext.navigate', { context, url: 'https://www.naukri.com/mnjuser/profile', wait: 'complete' });
      return context;
    },
    async openTab(url) {
      const { context } = await send('browsingContext.create', { type: 'tab', background: true });
      await send('browsingContext.navigate', { context, url, wait: 'complete' });
      return context;
    },
    closeTab: (context) => send('browsingContext.close', { context }),
    async naukriTabs() {
      const { contexts } = await send('browsingContext.getTree', {});
      return contexts.filter((c) => c.url.startsWith('https://www.naukri.com')).map((c) => c.url);
    },
    async close() { await send('browser.close').catch(() => {}); ws.close(); await waitExit(proc, 8000); },
    logs: () => out,
  };
}

// ---------------------------------------------------------------- the scenarios (same for every browser)

async function suite(d, mock) {
  const results = [];
  let finderSection = false;
  const step = async (name, fn) => {
    if (process.env.NR_FINDER_ONLY === '1' && !finderSection) return;
    if (process.env.NR_INSTAHYRE_ONLY === '1' && !name.startsWith('Instahyre')) return;
    const t0 = Date.now();
    try {
      await fn();
      results.push({ name, ok: true });
      console.log(`  ✔ ${name} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    } catch (e) {
      results.push({ name, ok: false, err: e.message });
      console.log(`  ✘ ${name}\n      ${e.message.split('\n').join('\n      ')}`);
    }
  };
  const status = () => d.msg({ type: 'status' });
  const setStore = (o) => d.evalExt(`X.storage.local.set(${JSON.stringify(o)}).then(() => true)`);
  const getStore = (k) => d.evalExt(`X.storage.local.get(${JSON.stringify(k)})`);
  const makeDue = async () => {
    const { plan } = await getStore('plan');
    plan.at = Date.now() - 1000;
    await setStore({ plan, lastWriteAt: 0 });
    return plan;
  };
  const BASE = 'Backend Software Engineer (Java) | 2+ YOE';
  mock.reset({ headline: BASE });
  let userTab = null;

  await step('installs idle: nothing scheduled and Naukri untouched until you start it', async () => {
    let alarms = [];
    for (let i = 0; i < 50 && !alarms.some((a) => a.name === 'tick'); i++) { alarms = await d.evalExt('X.alarms.getAll()'); await sleep(100); }
    const s = await status();
    assert.ok(s.settings.enabled && !s.halted, 'on and not paused');
    assert.ok(s.access, 'has naukri.com access');
    assert.equal(s.verified, false);
    assert.equal(s.plan, null, 'no plan yet');
    assert.ok(alarms.some((a) => a.name === 'tick' && a.periodInMinutes === 1), 'watchdog alarm every minute');
    assert.ok(!alarms.some((a) => a.name === 'due'), 'no run armed');
    assert.equal(await d.evalExt('X.action.getBadgeText({})'), '?');
    assert.equal(mock.apiCalls().length, 0, 'never touched Naukri on its own');
  });

  await step('check connection only reads; it does not start the schedule', async () => {
    const out = await d.msg({ type: 'check' });
    assert.equal(out.result.kind, 'ok', JSON.stringify(out.result));
    assert.equal(out.result.dry, true);
    assert.equal(out.status.account.name, 'Test User');
    assert.equal(mock.state.saves, 0, 'nothing saved');
    const get = mock.apiCalls('GET')[0];
    assert.equal(get.headers.authorization, 'Bearer FAKE.TOKEN.VALUE', 'token from the page cookie');
    assert.equal(get.headers['sec-fetch-site'], 'same-origin', 'request made from inside naukri.com');
    assert.equal(get.headers.appid, '105');
    assert.deepEqual(await d.naukriTabs(), [], 'temporary tab closed');
    assert.equal(out.status.verified, false, 'still waiting for the first supervised save');
    assert.equal(out.status.plan, null);
    assert.equal(out.status.backup, null, 'no backup from a read-only check');
    assert.equal(await d.evalExt('X.action.getBadgeText({})'), '?');
  });

  await step('first "Refresh now" (no Naukri tab): backs up, adds ".", verifies, then starts the schedule', async () => {
    const out = await d.msg({ type: 'runNow' });
    assert.equal(out.result.kind, 'ok', JSON.stringify(out.result));
    assert.equal(out.result.via, 'a background tab');
    assert.equal(mock.state.headline, `${BASE}.`);
    const put = mock.apiCalls('POST').at(-1);
    assert.equal(put.headers.origin, 'https://www.naukri.com', 'same-origin POST');
    assert.equal(put.headers['x-http-method-override'], 'PUT');
    assert.deepEqual(JSON.parse(put.body), { profile: { resumeHeadline: `${BASE}.` }, profileId: 'pid-12345678' });
    assert.equal(out.status.writesToday, 1);
    assert.deepEqual(await d.naukriTabs(), [], 'temporary tab closed');
    const { backup } = await getStore('backup');
    assert.equal(backup.profileId, 'pid-12345678');
    assert.equal(backup.json.profile[0].resumeHeadline, BASE, 'backup is the profile from before the save');
    assert.equal(backup.json.profile[0].keySkills, 'Java, Spring Boot, Kafka');
    const s = out.status;
    assert.ok(s.verified && s.backup && s.plan && s.plan.at > Date.now(), 'schedule started');
    const hm = istHM(s.plan.at);
    assert.ok(hm >= '07:00' && hm <= '19:00', `plan inside 07:00–19:00 IST (${hm})`);
    assert.ok(Math.abs(s.plan.at - s.plan.slotAt) <= 7.5 * MIN + 1000, 'within ±7.5 min of its slot');
    const alarms = await d.evalExt('X.alarms.getAll()');
    assert.ok(alarms.some((a) => a.name === 'due' && Math.abs(a.scheduledTime - s.plan.at) < 2000), 'due alarm at the planned time');
    assert.equal(await d.evalExt('X.action.getBadgeText({})'), '');
    assert.match(s.log.map((e) => e.msg).join('\n'), /Hourly refresh is now active/);
    const h = s.history[0];
    assert.equal(h.type, 'save');
    assert.equal(h.src, 'manual');
    assert.equal(h.action, 'added');
    assert.equal(h.confirmed, true, 'confirmed by the read-back');
    assert.ok(Math.abs(h.naukriAt - Date.now()) < 60_000, "Naukri's own modified time captured");
    assert.equal(s.headlineNow.text, `${BASE}.`, 'headline now = what Naukri returned after the save');
  });

  await step('refresh now with your Naukri tab open: uses it, removes the "." again, keeps the first backup', async () => {
    const { backup: b0 } = await getStore('backup');
    userTab = await d.openNaukriTab();
    await setStore({ lastWriteAt: 0 });
    const out = await d.msg({ type: 'runNow' });
    assert.equal(out.result.kind, 'ok', JSON.stringify(out.result));
    assert.equal(out.result.via, 'your Naukri tab');
    assert.equal(mock.state.headline, BASE, 'back to the original');
    assert.equal((await d.naukriTabs()).length, 1, 'no extra tab opened');
    assert.equal((await getStore('backup')).backup.t, b0.t, 'backup not overwritten');
  });

  await step('scheduled run hitting HTTP 500 retries in 2–5 min without pausing', async () => {
    mock.state.mode = '500';
    const p = await makeDue();
    await d.msg({ type: 'tick' });
    const s = await status();
    assert.ok(!s.halted, 'not paused');
    assert.equal(s.plan.slot, p.slot, 'same slot');
    assert.equal(s.plan.attempts, 1);
    assert.ok(s.plan.at >= Date.now() + 1.5 * MIN && s.plan.at <= Date.now() + 5.5 * MIN, 'retry in 2–5 min');
    assert.match(s.log[0].msg, /Retrying/);
    assert.deepEqual([s.history[0].type, s.history[0].reason, s.history[0].retryAt], ['fail', 'HTTP 500', s.plan.at]);
  });

  await step('scheduled run succeeds and moves on to the next slot', async () => {
    mock.state.mode = 'ok';
    const p = await makeDue();
    await d.msg({ type: 'tick' });
    const s = await status();
    assert.equal((await getStore('lastSlot')).lastSlot, p.slot);
    assert.ok(s.plan.slot > p.slot && s.plan.attempts === 0, 'next slot planned');
    assert.equal(mock.state.headline, `${BASE}.`);
    assert.equal(s.log[0].level, 'ok');
    assert.deepEqual([s.history[0].type, s.history[0].src, s.history[0].action, s.history[0].confirmed], ['save', 'auto', 'added', true]);
    assert.equal(s.headlineNow.text, `${BASE}.`);
  });

  await step('network failure is temporary (no pause)', async () => {
    mock.state.mode = 'drop';
    await setStore({ lastWriteAt: 0 });
    const out = await d.msg({ type: 'runNow' });
    assert.equal(out.result.kind, 'transient', JSON.stringify(out.result));
    assert.ok(!out.status.halted);
  });

  await step('HTTP 429 backs off for 2 hours and blocks further saves', async () => {
    mock.state.mode = '429';
    await setStore({ lastWriteAt: 0 });
    let out = await d.msg({ type: 'runNow' });
    assert.equal(out.result.kind, 'ratelimit');
    assert.ok(out.status.backoffUntil > Date.now() + 1.9 * HOUR);
    const n = mock.apiCalls().length;
    out = await d.msg({ type: 'runNow' });
    assert.equal(out.result.kind, 'skipped');
    assert.match(out.result.msg, /slow down/);
    assert.equal(mock.apiCalls().length, n, 'no request while backing off');
    await setStore({ backoffUntil: 0 });
  });

  await step('logged out (401): retries in a fresh tab, then pauses with "!" and stops calling Naukri', async () => {
    mock.state.mode = '401';
    await setStore({ lastWriteAt: 0 });
    const out = await d.msg({ type: 'runNow' });
    assert.equal(out.result.kind, 'auth', JSON.stringify(out.result));
    assert.equal(out.result.via, 'a background tab', 'second try was in a fresh tab');
    assert.equal(out.status.halted.kind, 'auth');
    assert.equal(out.status.halted.short, 'logged out');
    assert.deepEqual([out.status.history[0].type, out.status.history[0].reason], ['pause', 'logged out']);
    assert.equal(await d.evalExt('X.action.getBadgeText({})'), '!');
    assert.equal((await d.naukriTabs()).length, 1, 'fresh tab closed, your tab kept');
    const n = mock.state.requests.length;
    await d.msg({ type: 'tick' });
    assert.equal(mock.state.requests.length, n, 'paused: the watchdog sends nothing');
    assert.equal((await status()).plan, null, 'paused: nothing scheduled');
    assert.ok(!(await d.evalExt('X.alarms.getAll()')).some((a) => a.name === 'due'), 'paused: no run armed');
  });

  await step('resume clears the pause', async () => {
    mock.state.mode = 'ok';
    const s = await d.msg({ type: 'resume' });
    assert.ok(!s.halted && s.settings.enabled && s.plan);
    assert.equal(await d.evalExt('X.action.getBadgeText({})'), '');
  });

  await step('changed API response shape pauses instead of guessing', async () => {
    mock.state.mode = 'shape';
    await setStore({ lastWriteAt: 0 });
    const n = mock.state.saves;
    const out = await d.msg({ type: 'runNow' });
    assert.equal(out.result.kind, 'fatal');
    assert.match(out.status.halted.reason, /changed shape/);
    assert.equal(mock.state.saves, n, 'nothing written');
    mock.state.mode = 'ok';
    await d.msg({ type: 'resume' });
  });

  await step('save that silently does nothing is detected by the read-back and pauses', async () => {
    mock.state.mode = 'ignore';
    await setStore({ lastWriteAt: 0 });
    const before = mock.state.headline;
    const out = await d.msg({ type: 'runNow' });
    assert.equal(out.result.kind, 'fatal', JSON.stringify(out.result));
    assert.match(out.result.msg, /did not change/);
    assert.equal(mock.state.headline, before);
    mock.state.mode = 'ok';
    await d.msg({ type: 'resume' });
  });

  await step('a save that empties other profile fields is caught and pauses', async () => {
    mock.state.mode = 'wipe';
    await setStore({ lastWriteAt: 0 });
    const out = await d.msg({ type: 'runNow' });
    assert.equal(out.result.kind, 'fatal', JSON.stringify(out.result));
    assert.match(out.status.halted.reason, /profile\.keySkills/);
    assert.match(out.status.halted.reason, /employments/);
    mock.state.mode = 'ok';
    mock.state.keySkills = 'Java, Spring Boot, Kafka';
    mock.state.employments = [{ designation: 'Software Engineer', organization: 'Some Co' }];
    await d.msg({ type: 'resume' });
  });

  await step('daily safety cap blocks saves without touching Naukri', async () => {
    const { day } = await getStore('day');
    await setStore({ day: { key: day.key, writes: 16 }, lastWriteAt: 0 });
    const n = mock.apiCalls().length;
    const out = await d.msg({ type: 'runNow' });
    assert.equal(out.result.kind, 'skipped');
    assert.match(out.result.msg, /daily safety cap/);
    assert.equal(mock.apiCalls().length, n);
    await setStore({ day });
  });

  await step('two clicks at once save only once', async () => {
    await setStore({ lastWriteAt: 0 });
    const n = mock.state.saves;
    const [a, b] = await Promise.all([d.msg({ type: 'runNow' }), d.msg({ type: 'runNow' })]);
    const kinds = [a.result.kind, b.result.kind].sort();
    assert.ok(kinds.includes('ok') && (kinds.includes('busy') || kinds.includes('skipped')), kinds.join(','));
    assert.equal(mock.state.saves, n + 1);
  });

  await step('a slot missed while asleep is skipped, not run late', async () => {
    const { plan } = await getStore('plan');
    plan.at = Date.now() - 2 * HOUR;
    plan.deadline = Date.now() - HOUR;
    await setStore({ plan });
    const n = mock.state.requests.length;
    await d.msg({ type: 'tick' });
    const s = await status();
    assert.equal(mock.state.requests.length, n, 'no request');
    assert.match(s.log[0].msg, /Missed the/);
    assert.equal(s.history[0].type, 'skip');
    assert.match(s.history[0].reason, /missed \(PC asleep/);
    assert.ok(s.plan.slot > plan.slot);
  });

  await step('switching off stops everything (and lets the PC sleep); switching on re-plans', async () => {
    const chromium = d.name !== 'firefox';
    assert.equal((await status()).keepAwake.active, chromium, 'keep-awake held while on (Chrome/Edge only)');
    let s = await d.msg({ type: 'saveSettings', patch: { enabled: false } });
    assert.equal(s.settings.enabled, false);
    assert.equal(s.keepAwake.active, false, 'keep-awake released when off');
    assert.equal(await d.evalExt('X.action.getBadgeText({})'), 'off');
    let alarms = await d.evalExt('X.alarms.getAll()');
    assert.ok(!alarms.some((a) => a.name === 'due') && alarms.some((a) => a.name === 'tick'));
    s = await d.msg({ type: 'saveSettings', patch: { enabled: true } });
    assert.ok(s.settings.enabled && s.plan);
    assert.equal(s.keepAwake.available, chromium);
    assert.equal(s.keepAwake.active, chromium);
    alarms = await d.evalExt('X.alarms.getAll()');
    assert.ok(alarms.some((a) => a.name === 'due'));
    s = await d.msg({ type: 'saveSettings', patch: { keepAwake: false } });
    assert.equal(s.keepAwake.active, false, 'keep-awake can be switched off on its own');
    s = await d.msg({ type: 'saveSettings', patch: { keepAwake: true } });
    assert.equal(s.keepAwake.active, chromium);
  });

  if (d.freezeTab) {
    await step('a frozen (sleeping) Naukri tab is given up on and a background tab saves instead', async () => {
      await d.freezeTab(userTab, true);
      await setStore({ lastWriteAt: 0 });
      const before = mock.state.headline;
      const t0 = Date.now();
      const out = await d.msg({ type: 'runNow' });
      const secs = ((Date.now() - t0) / 1000).toFixed(0);
      assert.equal(out.result.kind, 'ok', JSON.stringify(out.result));
      assert.equal(out.result.via, 'a background tab', `fell back after ${secs}s`);
      assert.notEqual(mock.state.headline, before, 'saved');
      assert.equal((await d.naukriTabs()).length, 1, 'background tab closed, frozen tab kept');
      console.log(`      (frozen tab abandoned after ~${secs}s)`);
      await d.freezeTab(userTab, false);
      await sleep(500);
    });
  }

  await step('a sleeping (discarded) Naukri tab is left asleep and a background tab saves instead', async () => {
    let tabs = await d.evalExt(`X.tabs.query({ url: 'https://www.naukri.com/*' })`);
    assert.equal(tabs.length, 1, 'one Naukri tab open');
    await d.evalExt(`X.tabs.discard(${tabs[0].id}).then(() => true)`);
    tabs = await d.evalExt(`X.tabs.query({ url: 'https://www.naukri.com/*' })`);
    assert.ok(tabs.length === 1 && tabs[0].discarded, 'the tab is asleep');
    await setStore({ lastWriteAt: 0 });
    const before = mock.state.headline;
    const out = await d.msg({ type: 'runNow' });
    assert.equal(out.result.kind, 'ok', JSON.stringify(out.result));
    assert.equal(out.result.via, 'a background tab');
    assert.notEqual(mock.state.headline, before, 'saved');
    tabs = await d.evalExt(`X.tabs.query({ url: 'https://www.naukri.com/*' })`);
    assert.ok(tabs.length === 1 && tabs[0].discarded, 'your tab is still asleep, background tab closed');
  });

  await step('history keeps today and yesterday; the day before rolls off', async () => {
    const { history } = await getStore('history');
    const now = Date.now();
    const yesterday = { t: now - DAY, type: 'save', src: 'auto', action: 'removed', confirmed: true, naukriAt: null };
    const older = { t: now - 2 * DAY - MIN, type: 'save', src: 'auto', action: 'added', confirmed: true, naukriAt: null };
    await setStore({ history: [...history, yesterday, older] });
    const s = await status();
    assert.ok(s.history.some((e) => e.t === yesterday.t), 'yesterday kept');
    assert.ok(!s.history.some((e) => e.t === older.t), 'day before yesterday dropped');
    const todaysSaves = s.history.filter((e) => e.type === 'save' && e.t > now - 6 * HOUR).length;
    assert.equal(todaysSaves, s.writesToday, 'every save made today is listed');
  });

  await step('popup: short status, headline as Naukri returned it, Today/Yesterday history', async () => {
    await sleep(1700);
    const view = await d.evalExt(`(() => {
      const q = (sel) => document.querySelector(sel);
      return {
        headline: q('#headline').textContent,
        account: q('#account').textContent,
        now: q('#now').textContent,
        groups: [...document.querySelectorAll('#history h2')].map((h) => h.textContent),
        rows: [...document.querySelectorAll('#history li')].map((li) => li.textContent),
        backup: !q('#backup-link').hidden,
        logs: document.querySelectorAll('#log li').length,
        words: document.body.innerText.split(/\\s+/).length,
      };
    })()`);
    assert.match(view.headline, /^On · next /);
    assert.equal(view.account, 'Test User');
    assert.match(view.now, /^Backend Soft…\(Java\) \| 2\+ YOE(\.| \(no dot\))\d\d:\d\d$/, view.now);
    assert.match(view.groups[0], /^Today\d+ saves$/);
    assert.equal(view.groups[1], 'YesterdaySaves'.replace('Saves', '1 save'));
    assert.ok(view.rows.some((r) => /^\d\d:\d\d✓(added|removed) "\."(· manual)?Naukri \d\d:\d\d$/.test(r.replace(/ · manual/, '· manual'))), view.rows.join(' | '));
    assert.ok(view.rows.some((r) => /✗HTTP 500retry \d\d:\d\d/.test(r)), 'failed run listed with its retry time');
    assert.ok(view.rows.some((r) => /!paused: logged out/.test(r)), 'pause listed');
    assert.ok(view.backup && view.logs >= 8, 'backup and technical log tucked under Details');
  });

  await step('backup page shows the pre-save profile and offers download/delete', async () => {
    const view = await d.evalExt(`(async () => {
      const f = document.createElement('iframe');
      f.src = 'backup.html';
      document.body.append(f);
      await new Promise((r) => { f.onload = r; });
      await new Promise((r) => setTimeout(r, 400));
      const doc = f.contentDocument;
      const out = { meta: doc.getElementById('meta').textContent, json: doc.getElementById('json').textContent,
        download: doc.getElementById('download').disabled, del: doc.getElementById('delete').disabled };
      f.remove();
      return out;
    })()`);
    assert.match(view.meta, /taken right before the first automatic edit \(Test User\)/);
    assert.match(view.json, /"resumeHeadline": "Backend Software Engineer \(Java\) \| 2\+ YOE"/);
    assert.equal(view.download, false);
    assert.equal(view.del, false);
  });

  // ---------------------------------------------------------------- the job finder
  finderSection = true;
  const jobs = () => d.msg({ type: 'jobsStatus' });
  const waitRun = async (since, ms = 120_000) => {
    const end = Date.now() + ms;
    let s;
    while (Date.now() < end) {
      s = await jobs();
      if (!s.running && s.lastRun && s.lastRun.t >= since) return s;
      await sleep(400);
    }
    throw new Error(`the finder run didn't finish: ${JSON.stringify(s && s.lastRun)}`);
  };
  const naukriPosts = () => mock.state.requests.filter((r) => r.method === 'POST' && !/fullprofiles/.test(r.path));

  await step('job finder: off by default, nothing searched, nothing sent', async () => {
    const s = await jobs();
    assert.equal(s.settings.enabled, false);
    assert.equal(s.settings.hasToken, false);
    assert.equal(s.plan, null);
    assert.equal(mock.searchPages().length, 0, 'no search page opened');
    assert.equal(mock.state.radarPosts.length, 0);
    assert.ok(s.access.naukri && s.access.site, 'has access to Naukri and the site');
  });

  await step('job finder settings: a wrong site token is refused, the right one passes the site check', async () => {
    await d.msg({ type: 'jobsSave', patch: { token: 'WRONG' } });
    const bad = await d.msg({ type: 'jobsTest' });
    assert.equal(bad.ok, false);
    assert.equal(bad.short, 'site token rejected');
    await d.msg({ type: 'jobsSave', patch: { token: RADAR_TOKEN } });
    const good = await d.msg({ type: 'jobsTest' });
    assert.equal(good.ok, true, JSON.stringify(good));
    assert.equal(mock.state.radarPosts.length, 0, 'a check uploads nothing');
  });

  // What the site's Job tracker page made of its handover (the page reports it to the mock).
  const waitBridge = async (n, ms = 30_000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (mock.state.bridgeResults.length >= n) return mock.state.bridgeResults[n - 1];
      await sleep(250);
    }
    throw new Error(`the Job tracker page reported ${mock.state.bridgeResults.length} results, wanted ${n}`);
  };
  const SITE_PAGE = 'https://interviewplanprep.vercel.app/job-tracker';

  await step("connects itself: your site's Job tracker, signed in as you, hands over the finder's own token; nothing else can", async () => {
    await d.msg({ type: 'jobsSave', patch: { token: '' } });
    assert.equal((await jobs()).settings.hasToken, false);
    const connectShown = await d.evalExt("(async () => { await new Promise((r) => setTimeout(r, 1700)); return !document.getElementById('jobsConnect').hidden && document.getElementById('jobsNow').hidden; })()");
    assert.equal(connectShown, true, 'the popup offers "Connect to your site" instead of "Find jobs now"');
    // A token your site doesn't accept is turned down, and so is anything not shaped like one.
    const bogus = await d.msg({ type: 'jobsPair', token: `nrf1.${'X'.repeat(43)}` });
    assert.equal(bogus.ok, false, JSON.stringify(bogus));
    assert.equal((await d.msg({ type: 'jobsPair', token: RADAR_TOKEN })).short, 'not a finder token');
    assert.equal((await jobs()).settings.hasToken, false);
    // Signed in to the site as someone else: no token.
    const t1 = await d.openTab(`${SITE_PAGE}?idt=someone-else`);
    const stranger = await waitBridge(1);
    await d.closeTab(t1).catch(() => {});
    assert.equal(stranger.present, true, `the page found the extension: ${JSON.stringify(stranger)}`);
    assert.equal(stranger.connected, false);
    assert.match(stranger.error || '', /owner/);
    assert.equal((await jobs()).settings.hasToken, false);
    assert.equal(mock.state.radarPairs, 0);
    // Signed in as the owner: connected, with the finder's own token.
    const t2 = await d.openTab(SITE_PAGE);
    const owner = await waitBridge(2);
    await d.closeTab(t2).catch(() => {});
    assert.equal(owner.justConnected, true, JSON.stringify(owner));
    assert.equal(owner.scope, 'both');
    const s = await jobs();
    assert.equal(s.settings.hasToken, true);
    assert.equal(s.settings.viaSite, true);
    assert.ok(s.settings.pairedAt > Date.now() - 60_000);
    assert.equal(mock.state.radarPairs, 1);
    assert.equal((await d.msg({ type: 'jobsTest' })).ok, true, 'your site accepts the finder token');
    // Opening the page again: already connected, nothing handed over.
    const t3 = await d.openTab(SITE_PAGE);
    const again = await waitBridge(3);
    await d.closeTab(t3).catch(() => {});
    assert.equal(again.connected, true, JSON.stringify(again));
    assert.equal(again.justConnected, undefined);
    assert.equal(mock.state.radarPairs, 1);
    assert.equal(mock.state.radarPosts.length, 0, 'connecting uploads nothing');
  });

  const excluded = [5, 8, 24, 65, 68].map(EXPECT.idOf);
  const eligible = [...new Set(Object.values(fixtures()).flat(2).map(x => x.jobId))].filter(id => !excluded.includes(id));
  const readable = eligible.filter(id => ![63, 66, 67].map(EXPECT.idOf).includes(id));
  const queuedIds = async () => (await getStore('jobsRateQ')).jobsRateQ.items.map(i => i.id).sort();

  await step("find jobs: reads Naukri's results, opens each eligible job page and queues every readable JD", async () => {
    await setStore({ jobsDev: { pause: [60, 120], searches: ['java spring boot developer', 'software engineer', 'generative ai engineer'] } });
    const t0 = Date.now();
    const r = await d.msg({ type: 'jobsNow' });
    assert.equal(r.result.kind, 'started');
    const s = await waitRun(t0);
    assert.equal(s.lastRun.outcome, 'ok', JSON.stringify(s.lastRun));
    const pages = mock.searchPages();
    assert.ok(pages.some((p) => p.path === '/java-spring-boot-developer-jobs' && /experience=2/.test(p.search) && /jobAge=3/.test(p.search)), "Naukri's own filters in the URL");
    assert.ok(pages.some((p) => p.path === '/java-spring-boot-developer-jobs-2'), 'went on to page 2: Naukri says there are more');
    assert.ok(!pages.some((p) => p.path === '/java-spring-boot-developer-jobs-3'), "stopped once Naukri's total was read");
    // Every page of every search, one page of each search in turn.
    assert.deepEqual(pages.map((p) => p.path), ['/java-spring-boot-developer-jobs', '/software-engineer-jobs', '/generative-ai-engineer-jobs', '/java-spring-boot-developer-jobs-2']);
    assert.equal(s.sweep && s.sweep.done, true, JSON.stringify(s.sweep));
    assert.deepEqual([s.sweep.over, s.sweep.searches, s.sweep.pages], [3, 3, 4]);
    assert.deepEqual(mock.jobPages().map(p => p.path.slice(-12)).sort(), [...eligible].sort());
    assert.deepEqual(await queuedIds(), [...readable].sort());
    assert.equal(mock.state.radarPosts.length, 0);
    assert.equal(s.queued, 1, 'unreadable JD stays pending');
    assert.equal(naukriPosts().length, 0);
    const { entries } = await d.msg({ type: 'jobsAudit' });
    assert.equal(entries.filter(x => x.pending).length, readable.length + 1);
    assert.ok(entries.every(x => x.k === 0 && x.w));
    const { doc } = await d.msg({ type: 'jobsAuditDoc', id: EXPECT.idOf(61) });
    assert.match(doc.jd, /Spring Boot/);
  });

  await step("the finder's settings page shows the sweep and the rules", async () => {
    const page = await d.evalExt(`(async () => {
      const f = document.createElement('iframe');
      f.src = X.runtime.getURL('jobs.html');
      document.body.append(f);
      await new Promise((r) => { f.onload = r; });
      await new Promise((r) => setTimeout(r, 1500));
      const doc = f.contentDocument;
      const out = { sweep: doc.getElementById('sweepLine').textContent, next: doc.getElementById('nextLine').textContent, rules: doc.getElementById('rules').textContent };
      f.remove();
      return out;
    })()`);
    assert.match(page.sweep, /^Sweep 1 read every page of all 3 searches \(4 pages/, page.sweep);
    assert.doesNotMatch(page.next, /Not responding/, page.next);
    assert.match(page.rules, /Every listing, not a sample/);
    assert.match(page.rules, /last 48 hours/);
    assert.match(page.rules, /both résumé summaries/);
    assert.match(page.rules, /Unknown experience goes to Groq/);
  });

  await step('a later run sweeps every page of every search again and queues both new listings once', async () => {
    mock.state.srpExtra = [listing(51, { title: 'Java Backend Developer', tagsAndSkills: 'Java,Spring Boot,Redis' }), listing(52, { title: 'iOS Developer' })];
    const before = mock.searchPages().length;
    const t0 = Date.now();
    await d.msg({ type: 'jobsNow' });
    const s = await waitRun(t0);
    assert.equal(mock.state.radarPosts.length, 0);
    assert.deepEqual(await queuedIds(), [...readable, EXPECT.idOf(51), EXPECT.idOf(52)].sort());
    assert.equal(mock.searchPages().length - before, 4, 'every page again: a new sweep');
    assert.deepEqual([s.sweep.n, s.sweep.done], [2, true]);
  });

  await step('Naukri asking "are you human?" pauses the finder at once; nothing is sent; Resume clears it', async () => {
    mock.state.srpMode = 'captcha';
    const t0 = Date.now();
    await d.msg({ type: 'jobsNow' });
    const s = await waitRun(t0);
    assert.ok(s.halted, 'paused');
    assert.equal(s.halted.short, 'Naukri asked for a check');
    assert.equal(mock.state.radarPosts.length, 0, 'nothing sent');
    assert.equal(mock.searchPages().filter((p) => p.t >= t0).length, 1, 'stopped at the first page that asked');
    mock.state.srpMode = 'ok';
    const r = await d.msg({ type: 'jobsResume' });
    assert.equal(r.halted, null);
  });

  await step('a check on a job page pauses it too; pending descriptions are retried after Resume', async () => {
    mock.state.jobMode = 'captcha';
    mock.state.srpExtra = [listing(53, { title: 'Backend Developer', tagsAndSkills: 'Java,Spring Boot,PostgreSQL,Redis' })];
    const t0 = Date.now();
    await d.msg({ type: 'jobsNow' });
    let s = await waitRun(t0);
    assert.equal(s.halted && s.halted.short, 'Naukri asked for a check');
    assert.ok(s.queued >= 1, 'the interrupted job waits');
    assert.equal(mock.state.radarPosts.length, 0, 'nothing sent');
    mock.state.jobMode = 'ok';
    await d.msg({ type: 'jobsResume' });
    const t1 = Date.now();
    await d.msg({ type: 'jobsNow' });
    s = await waitRun(t1);
    assert.equal(s.lastRun.outcome, 'ok', JSON.stringify(s.lastRun));
    assert.ok((await queuedIds()).includes(EXPECT.idOf(53)));
    assert.equal(mock.state.radarPosts.length, 0);
    mock.state.srpExtra = [];
    await d.msg({ type: 'jobsResume' }); // the next step's run checks the site again
  });

  await step("a site that doesn't know the finder yet stops it before anything is searched or sent", async () => {
    mock.state.radarMode = 'old';
    try {
      const t0 = Date.now();
      await d.msg({ type: 'jobsNow' });
      const s = await waitRun(t0);
      assert.equal(s.halted && s.halted.short, 'site not updated');
      assert.equal(mock.state.radarPosts.length, 0, 'nothing sent');
      assert.equal(mock.searchPages().filter((p) => p.t >= t0).length, 0, 'not even searched');
    } finally {
      mock.state.radarMode = 'ok';
      await d.msg({ type: 'jobsResume' });
    }
  });

  await step('switching the finder on plans one run a day, around 17:00 IST; off clears it', async () => {
    await d.msg({ type: 'jobsSave', patch: { enabled: true } });
    const s = await jobs();
    assert.ok(s.plan && s.plan.at > Date.now() - 1000, JSON.stringify(s.plan));
    const hm = istHM(s.plan.at);
    const mins = Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3));
    assert.ok(Math.abs(mins - 17 * 60) <= 7, hm);
    assert.ok(s.plan.at - Date.now() <= 25 * HOUR, 'within a day');
    await d.msg({ type: 'jobsSave', patch: { enabled: false } });
    assert.equal((await jobs()).plan, null);
  });

  await step('popup shows the job finder in one line', async () => {
    const line = await d.evalExt("(async () => { await new Promise((r) => setTimeout(r, 1700)); return document.getElementById('jobsLine').textContent; })()");
    assert.equal(line, 'Off · 0 Backend · 0 AI today');
  });

  await step('a browser set to "AI only" runs just the AI searches; each job still goes on its own list', async () => {
    await d.msg({ type: 'jobsSave', patch: { scope: 'ai' } });
    assert.deepEqual((await jobs()).searches.length > 0 && (await jobs()).searches.every((k) => !/java|software/.test(k)), true, 'only AI searches');
    await d.msg({ type: 'jobsRescan' }); // forget today's verdicts so the same listings are read again
    const before = mock.state.radarPosts.length;
    const t0 = Date.now();
    await d.msg({ type: 'jobsNow' });
    const s = await waitRun(t0);
    assert.equal(s.lastRun.outcome, 'ok', JSON.stringify(s.lastRun));
    assert.equal(s.lastRun.scope, 'ai');
    const pages = mock.searchPages().filter((p) => p.t >= t0).map((p) => p.path);
    assert.ok(pages.length > 0 && pages.every((p) => p.startsWith('/generative-ai-engineer-jobs')), pages.join(' '));
    assert.equal(mock.state.radarPosts.length, before);
    assert.deepEqual(await queuedIds(), [...readable, ...[51, 52, 53].map(EXPECT.idOf)].sort());
    await d.msg({ type: 'jobsSave', patch: { scope: 'both' } });
    await setStore({ jobsDev: null });
  });

  // The AI rating, on the fake api.groq.com (mock-naukri.mjs), with test resumes.
  const DEV = { pause: [60, 120], searches: ['java spring boot developer', 'software engineer', 'generative ai engineer'], resume: TEST_RESUME };
  const waitRate = async (since, ms = 90_000) => {
    const end = Date.now() + ms;
    let s;
    while (Date.now() < end) {
      s = await jobs();
      if (!s.running && s.rating.last && s.rating.last.t >= since) return s;
      await sleep(400);
    }
    throw new Error(`the rating didn't finish: ${JSON.stringify(s && s.rating)}`);
  };

  await step('AI rating: a rejected and a busy key leave work for the good key; the report retains every score', async () => {
    await setStore({ jobsDev: DEV });
    await d.msg({ type: 'jobsRescan' });
    const t0 = Date.now();
    await d.msg({ type: 'jobsNow' });
    let s = await waitRun(t0);
    assert.equal(s.lastRun.outcome, 'ok', JSON.stringify(s.lastRun));
    assert.equal(mock.state.groqCalls.length, 0, 'no key: Groq untouched');
    assert.equal(s.rating.on, false);
    assert.match(s.rating.why, /no Groq key/);
    const waiting = s.rating.queued;
    assert.equal(waiting, readable.length + 3);
    // Five accounts, including a rejected key and a temporarily limited key.
    const saved = await d.msg({ type: 'jobsSave', patch: { groqKeys: [GROQ_KEYS.bad, GROQ_KEYS.good, GROQ_KEYS.busy, GROQ_KEYS.good2, GROQ_KEYS.good3].join('\n') } });
    assert.equal(saved.rating.keys.length, 5);
    assert.ok(!Object.values(GROQ_KEYS).some((k) => JSON.stringify(saved).includes(k)), 'no key in the status');
    assert.equal((await d.msg({ type: 'jobsSave', patch: { groqKeys: 'not a key' } })).error !== undefined, true, 'a typo is refused, the keys stay');
    assert.equal((await jobs()).rating.keys.length, 5);
    const check = await d.msg({ type: 'jobsKeyCheck' });
    assert.equal(check.ok, true, JSON.stringify(check));
    assert.deepEqual(check.keys.map((k) => k.msg), ['rejected', 'works', 'works', 'works', 'works']);
    const t1 = Date.now();
    assert.equal((await d.msg({ type: 'jobsRateNow' })).result.kind, 'started');
    s = await waitRate(t1, 210000);
    assert.equal(s.rating.queued, 0, JSON.stringify(s.rating.last));
    assert.equal(s.rating.last.rated, waiting);
    const successful = mock.state.groqCalls.filter(c => [GROQ_KEYS.good, GROQ_KEYS.good2, GROQ_KEYS.good3].includes(c.key));
    assert.equal(successful.length, waiting, 'one successful score per readable eligible JD');
    assert.equal(mock.state.payLookups.length, 0);
    const posted = mock.state.radarPosts.flatMap(p => p.openings);
    const byId = Object.fromEntries(posted.map(o => [o.openingId, o]));
    for (const o of posted) {
      assert.equal(o.ai.v, 4);
      assert.ok(o.dbg.p.includes('[Backend profile summary]'));
      assert.ok(!o.dbg.p.includes('Documented skills:'));
    }
    assert.equal(byId[EXPECT.idOf(41)].profile, 'ai');
    assert.equal(byId[EXPECT.idOf(11)].profile, 'ai', 'a backend search can discover AI work');
    assert.equal(byId[EXPECT.idOf(61)].profile, 'backend');
    assert.equal(byId[EXPECT.idOf(31)].profile, 'backend', 'a short JD was read from the correct job record');
    assert.equal(byId[EXPECT.idOf(12)].apply, 'company');
    assert.ok(!byId[EXPECT.idOf(6)], 'salary ceiling below 18');
    assert.ok(!byId[EXPECT.idOf(71)], 'neither profile');
    for (const n of [41, 71, 6]) {
      const { doc } = await d.msg({ type: 'jobsAuditDoc', id: EXPECT.idOf(n) });
      assert.ok(successful.some(c => c.body.messages[0].content === doc.dbg.p), 'exact local prompt');
      assert.equal(typeof JSON.parse(doc.dbg.o).score, 'number');
    }
  });

  await step('every key rejected: the rating pauses and says why; jobs are still found and queued; new keys resume it', async () => {
    mock.state.groqMode = 'reject';
    mock.state.srpExtra = [listing(54, { title: 'Java Backend Developer', tagsAndSkills: 'Java,Spring Boot,Redis' })];
    try {
      const t0 = Date.now();
      await d.msg({ type: 'jobsNow' });
      const s = await waitRun(t0);
      const seen = JSON.stringify({ run: s.lastRun, rating: s.rating, calls: mock.state.groqCalls.filter((c) => c.t >= t0).map((c) => c.key.slice(-4)) });
      assert.equal(s.lastRun.outcome, 'ok', seen);
      assert.match(s.lastRun.note, /AI rating stopped: Groq rejected every key/, seen);
      assert.equal(s.rating.on, false);
      assert.match(s.rating.why, /^paused: Groq rejected every key/);
      const sent = mock.state.radarPosts.flatMap((p) => p.openings).filter((o) => o.openingId === EXPECT.idOf(54));
      assert.equal(sent.length, 0);
      assert.ok((await queuedIds()).includes(EXPECT.idOf(54)));
    } finally {
      mock.state.groqMode = 'ok';
      mock.state.srpExtra = [];
    }
    const again = await d.msg({ type: 'jobsSave', patch: { groqKeys: [GROQ_KEYS.good] } });
    assert.equal(again.rating.on, true, JSON.stringify(again.rating));
  });

  await step('a key Groq answers 429 for minutes is retired for an hour; rating retries after retirement and discovery continues; Resume brings keys back at once', async () => {
    // The rule is 5 minutes of 429 and an hour; the test knobs make it 0.4 s and 6 s.
    await setStore({ jobsDev: { ...DEV, rate: { limitBaseMs: 50, limitStopMs: 400, retireMs: 6000 } } });
    mock.state.groqMode = 'limit';
    mock.state.srpExtra = [listing(56, { title: 'Java Backend Developer', tagsAndSkills: 'Java,Spring Boot,Redis' })];
    try {
      let t0 = Date.now();
      await d.msg({ type: 'jobsNow' });
      let s = await waitRun(t0);
      const seen = JSON.stringify({ run: s.lastRun, halted: s.halted, rating: s.rating });
      assert.equal(s.lastRun.outcome, 'ok', seen);
      assert.equal(s.halted, null);
      assert.ok(s.rating.retryAt, seen);
      const hint = s.rating.keys[0];
      assert.ok(s.rating.today.keys[hint].retiredUntil > 0);
      // (A job from the step before is already waiting for its rating, so the run pauses at its first page.)
      assert.ok(!mock.state.radarPosts.flatMap((p) => p.openings).some((o) => o.openingId === EXPECT.idOf(56) && o.ai), 'nothing rated while every key is out');
      // Still paused while the hour lasts: waking it up does nothing.
      const callsBefore = mock.state.groqCalls.length;
      if (s.rating.retryAt > Date.now() + 1000) {
        await d.msg({ type: 'jobsTickNow' });
        assert.equal(mock.state.groqCalls.length, callsBefore);
      }
      // The hour is over: it wakes up, clears the pause and carries on; the job is rated.
      mock.state.groqMode = 'ok';
      while (Date.now() < s.rating.retryAt + 300) await sleep(200);
      await d.msg({ type: 'jobsTickNow' });
      const ratedPosts = () => mock.state.radarPosts.flatMap((p) => p.openings).filter((o) => o.openingId === EXPECT.idOf(56) && o.ai);
      const waitEnd = Date.now() + 90_000;
      while (Date.now() < waitEnd && (!ratedPosts().length || (s = await jobs()).running)) await sleep(400);
      s = await jobs();
      assert.equal(s.halted, null, JSON.stringify({ run: s.lastRun, halted: s.halted }));
      assert.ok(ratedPosts().length, 'rated once the key was back: the sweep carried on where it stopped');
      assert.equal(s.rating.today.keys[hint].retiredUntil || 0, 0);

      // Retired again; Resume brings the key back at once.
      mock.state.groqMode = 'limit';
      mock.state.srpExtra = [listing(57, { title: 'Java Backend Developer', tagsAndSkills: 'Java,Spring Boot,Redis' })];
      t0 = Date.now();
      await d.msg({ type: 'jobsNow' });
      s = await waitRun(t0);
      assert.ok(s.rating.retryAt);
      mock.state.groqMode = 'ok';
      s = await d.msg({ type: 'jobsResume' });
      assert.equal(s.halted, null);
      assert.equal(s.rating.today.keys[hint].retiredUntil || 0, 0, 'Resume forgets the retirement');
    } finally {
      mock.state.groqMode = 'ok';
      mock.state.srpExtra = [];
      await d.msg({ type: 'jobsResume' }); // whatever happened above, the next steps start unpaused
      await setStore({ jobsDev: DEV }); // as the step before left it
    }
  });

  await step("the optional Instahyre company list cannot remove a Naukri LLM match", async () => {
    const names = (await jobs()).lowPay.names;
    await d.msg({ type: 'jobsSave', patch: { lowPay: [...names, 'Company 12'] } });
    await d.msg({ type: 'jobsRescan' });
    const before = mock.state.radarPosts.length;
    const t0 = Date.now();
    await d.msg({ type: 'jobsNow' });
    const s = await waitRun(t0);
    assert.equal(s.lastRun.outcome, 'ok', JSON.stringify(s.lastRun));
    const posts = mock.state.radarPosts.slice(before);
    assert.ok(!posts.some(p => (p.remove || []).some(r => r.openingId === EXPECT.idOf(12))));
    assert.ok(!mock.state.groqCalls.some(c => c.t >= t0 && c.body.messages[0].content.includes('Company: Company 12\n')), 'cached decision reused');
    await d.msg({ type: 'jobsSave', patch: { lowPay: null, groqKeys: [] } });
    await setStore({ jobsDev: null });
  });

  await step('a later run retries unreadable jobs and skips every completed JD', async () => {
    await setStore({ jobsDev: DEV });
    const pagesBefore = mock.jobPages().length;
    const postsBefore = mock.state.radarPosts.length;
    const t0 = Date.now();
    await d.msg({ type: 'jobsNow' });
    const s = await waitRun(t0);
    assert.equal(s.lastRun.outcome, 'ok', JSON.stringify(s.lastRun));
    assert.equal(s.sweep.done, true);
    assert.ok(mock.searchPages().some((p) => p.t >= t0), 'it read the search pages again, for anything new');
    assert.ok(mock.jobPages().slice(pagesBefore).every(p => p.path.endsWith(EXPECT.idOf(63))), 'only the unreadable page retried');
    assert.equal(s.lastRun.fresh, 0, 'every listing was already judged');
    assert.equal(mock.state.radarPosts.length, postsBefore, 'nothing new to send');
    assert.ok(s.judged >= EXPECT.keep.length + EXPECT.drop.length - EXPECT.applied.card.length, String(s.judged));
  });

  await step('Start over: your site deletes the finder\'s jobs, this browser forgets what it read, and every eligible job is discovered again', async () => {
    const pagesBefore = mock.jobPages().length;
    const postsBefore = mock.state.radarPosts.length;
    const t0 = Date.now();
    assert.ok(((await jobs()).rating.ratedKept || 0) > 0, 'there are ratings to forget');
    const r = await d.msg({ type: 'jobsStartOver' });
    assert.equal(r.result.kind, 'started', JSON.stringify(r.result));
    assert.equal(mock.state.radarResets, 1, 'your site was asked to delete the finder\'s jobs');
    const s = await waitRun(t0);
    assert.equal(s.lastRun.outcome, 'ok', JSON.stringify(s.lastRun));
    assert.equal(s.lastRun.trigger, 'start over');
    assert.ok(s.startedOver >= t0);
    assert.equal(s.rating.ratedKept || 0, 0, 'Start fresh forgets the ratings too');
    const opened = mock.jobPages().slice(pagesBefore).map((p) => p.path);
    for (const id of eligible) assert.ok(opened.some((p) => p.endsWith(id)), `${id}: its JD read again`);
    const sent = mock.state.radarPosts.slice(postsBefore).flatMap((p) => p.openings).map((o) => o.openingId);
    assert.deepEqual(sent, []);
    assert.deepEqual(await queuedIds(), [...readable].sort());
    assert.equal(s.daily.kept.backend + s.daily.kept.ai, 0);
  });

  await step('Start over in your other browser: this one sees it at its next run and starts over too', async () => {
    mock.state.finderResetAt = Date.now() + 1; // as if the other browser had just started over
    const pagesBefore = mock.jobPages().length;
    const postsBefore = mock.state.radarPosts.length;
    const t0 = Date.now();
    await d.msg({ type: 'jobsNow' });
    const s = await waitRun(t0);
    assert.equal(s.lastRun.outcome, 'ok', JSON.stringify(s.lastRun));
    assert.match(s.lastRun.note, /^started over/);
    assert.ok(mock.jobPages().length > pagesBefore, 'its JDs read again');
    const sent = mock.state.radarPosts.slice(postsBefore).flatMap((p) => p.openings).map((o) => o.openingId);
    assert.deepEqual(sent, []);
    assert.deepEqual(await queuedIds(), [...readable].sort());
    await setStore({ jobsDev: null });
  });

  await step("the finder's tab closed mid-run (by you, or discarded by the browser): it opens a new one and the run goes on", async () => {
    await setStore({ jobsDev: { pause: [150, 250], searches: ['java spring boot developer', 'software engineer', 'generative ai engineer'] } });
    await d.msg({ type: 'jobsRescan' }); // every JD read again, so the run takes a few seconds
    const postsBefore = mock.state.radarPosts.length;
    const t0 = Date.now();
    await d.msg({ type: 'jobsNow' });
    let closed = 0;
    for (let i = 0; i < 40 && closed < 2; i++) {
      await sleep(500);
      if ((await d.msg({ type: 'jobsDevCloseTab' })).closed) { closed += 1; await sleep(1500); }
    }
    assert.ok(closed >= 1, 'the finder tab was open mid-run, and was closed');
    const s = await waitRun(t0);
    assert.equal(s.lastRun.outcome, 'ok', JSON.stringify(s.lastRun));
    assert.doesNotMatch(String(s.lastRun.note), /internal error|No tab/, JSON.stringify(s.lastRun));
    assert.match(String(s.lastRun.note), /opened a new one/, JSON.stringify(s.lastRun));
    const sent = mock.state.radarPosts.slice(postsBefore).flatMap((p) => p.openings).map((o) => o.openingId);
    assert.deepEqual(sent, []);
    assert.deepEqual(await queuedIds(), [...readable].sort());
    await setStore({ jobsDev: null });
  });

  await step('a run that died leaves "Running now…": Unlock clears it, and a reload (the extension restarting) does too', async () => {
    const KEY = 'jobs';
    const stateOf = async () => (await getStore(KEY))[KEY];
    const st = await stateOf();
    await setStore({ [KEY]: { ...st, lock: { until: Date.now() + 60 * 60_000 }, resting: { until: Date.now() + 600_000, part: 2 } } });
    let s = await jobs();
    assert.equal(s.running, true, 'a stale lock looks like a run');
    const r = await d.msg({ type: 'jobsUnlock' });
    assert.equal(r.result.kind, 'unlocked', JSON.stringify(r.result));
    s = await jobs();
    assert.equal(s.running, false, 'Unlock clears it');
    assert.ok(!(await stateOf()).lock && !(await stateOf()).resting);
    // And the finder works again at once.
    await setStore({ jobsDev: { pause: [60, 120], searches: ['java spring boot developer'] } });
    const t0 = Date.now();
    await d.msg({ type: 'jobsNow' });
    s = await waitRun(t0);
    assert.equal(s.lastRun.outcome, 'ok', JSON.stringify(s.lastRun));
    await setStore({ jobsDev: null });
  });

  // ---- Instahyre apply, on the fake www.instahyre.com (mock-instahyre.mjs)
  const instaStatus = () => d.msg({ type: 'instaStatus' });
  const instaRun = async (kind = 'java', over = {}, mockOver = {}) => {
    mock.instaReset(mockOver);
    await d.msg({ type: 'instaSave', patch: { dry: false, skipRules: true, maxRun: 40, maxDay: 500, pauseMin: 100, pauseMax: 200, ...over } });
    await d.msg({ type: 'instaClearLog' });
    const r = await d.msg({ type: 'instaStart', kind });
    assert.equal(r.result.kind, 'started', JSON.stringify(r.result));
    return r;
  };
  const instaWait = async (ms = 120_000) => {
    const end = Date.now() + ms;
    let s;
    while (Date.now() < end) {
      s = await instaStatus();
      if (!s.state.running) return s;
      await sleep(500);
    }
    throw new Error(`the Instahyre run didn't finish: ${JSON.stringify(s && s.state)}`);
  };
  const ids = () => mock.insta.applies.map((a) => a.id).sort();

  finderSection = false;
  await step('Instahyre dry run: opens and reads every job (past "Load more"), says what it would do, presses no Apply', async () => {
    await instaRun('java', { dry: true });
    const s = await instaWait();
 // TEMP
    assert.equal(mock.insta.applies.length, 0, 'no Apply pressed');
    assert.deepEqual(mock.insta.notInterested, [], 'never "Not interested"');
    const log = s.state.log;
    assert.equal(log.filter((x) => x.action === 'dry').length, 7, JSON.stringify(log.map((x) => [x.title, x.action, x.why])));
    const skipped = log.filter((x) => x.action === 'skipped');
    assert.deepEqual(skipped.map((x) => x.company).sort(), ['Accenture', 'Acme Labs', 'Neander']);
    assert.match(skipped.find((x) => x.company === 'Accenture').why, /low-pay|IT services/);
    assert.equal(skipped.find((x) => x.company === 'Neander').why, 'asks 4+ years');
    assert.match(s.state.note, /Done: the list is finished/, s.state.note);
    assert.equal(s.state.dry, true);
  });

  await step('Instahyre apply: applies to every fitting job one by one (both Klimb.io cards), skips IT services, QA and 4+ years, until the list is finished', async () => {
    await instaRun('java');
    const s = await instaWait();
    assert.deepEqual(ids(), ['j1', 'j10', 'j2', 'j3', 'j4', 'j8', 'j9'], JSON.stringify(s.state));
    assert.deepEqual(mock.insta.notInterested, [], 'a skipped job is never marked "Not interested"');
    assert.equal(s.state.applied, 7);
    assert.equal(s.state.skipped, 3);
    assert.equal(s.state.note, 'Done: the list is finished (7 applied, 3 skipped).');
    assert.equal(s.state.dayApplied, 7, "counted toward today's cap");
  });

  await step('Instahyre apply: stops at your cap for a run', async () => {
    await instaRun('java', { maxRun: 2 });
    const s = await instaWait();
    assert.equal(mock.insta.applies.length, 2);
    assert.match(s.state.note, /cap of 2 applications for one run/);
  });

  await step('Instahyre apply: the GenAI button opens its own link', async () => {
    await instaRun('ai', { maxRun: 1 });
    const s = await instaWait();
    assert.equal(s.state.kind, 'ai');
    assert.equal(mock.insta.applies.length, 1);
  });

  await step("Instahyre apply: the links are the owner's own two searches; settings saved by the first version move to them, and it applies to everything by default", async () => {
    const d0 = (await instaStatus()).defaults;
    assert.ok(d0.urlJava.endsWith('skills=Java,Spring+Boot'), d0.urlJava);
    assert.ok(d0.urlAi.endsWith('skills=PostgreSQL,Snowflake,Redis,Kafka,Amazon+S3,Azure,Firebase,Docker,LangGraph,LangChain,LLMs,Agentic+AI&years=2'), d0.urlAi);
    assert.equal(d0.skipRules, false, 'it applies to everything the search shows unless you turn the skip rules on');
    // What the first version saved (its guessed GenAI link, the safer limits): taken to the new ones.
    await setStore({ instaCfg: { urlJava: 'https://www.instahyre.com/candidate/opportunities/?company_size=0&job_type=0&search=true&skills=Java&years=2', urlAi: 'https://www.instahyre.com/candidate/opportunities/?company_size=0&job_type=0&search=true&skills=LLMs,rag,LangGraph&years=2', skipRules: true, maxRun: 40, maxDay: 100 } });
    const c = (await instaStatus()).cfg;
    assert.deepEqual([c.urlJava, c.urlAi, c.skipRules, c.maxRun, c.maxDay], [d0.urlJava, d0.urlAi, false, 100, 200]);
    // A link you pasted yourself is kept.
    const mine = 'https://www.instahyre.com/candidate/opportunities/?search=true&skills=Go&years=2';
    const s2 = await d.msg({ type: 'instaSave', patch: { urlAi: mine, skipRules: true, maxRun: 7 } });
    assert.deepEqual([s2.cfg.urlAi, s2.cfg.skipRules, s2.cfg.maxRun], [mine, true, 7]);
    await d.msg({ type: 'instaSave', patch: { urlAi: d0.urlAi, skipRules: false, maxRun: 100 } });
  });

  await step('Instahyre redirects to populated recommendations: rebuilds Java + Spring Boot, searches again on reload, applies once per filtered job', async () => {
    await instaRun('java', {}, { format: 'redirect', mode: 'slowResults' });
    const s = await instaWait();
    assert.deepEqual(ids(), ['j1', 'j10', 'j2', 'j3', 'j4', 'j8', 'j9'], s.state.note);
    assert.deepEqual(mock.insta.attempts.slice().sort(), ids());
    assert.deepEqual(mock.insta.searches, Array(2).fill({ skills: ['Java', 'Spring Boot'], years: null }));
  });

  await step('Instahyre GenAI restores exact saved skills and experience after a redirect; an empty filtered search ends cleanly', async () => {
    await instaRun('ai', { urlAi: 'https://www.instahyre.com/candidate/opportunities/?search=true&skills=C%2B%2B&skills=LangGraph&years=2' }, { jobs: [], format: 'redirect' });
    const s = await instaWait();
    assert.deepEqual(mock.insta.searches, [{ skills: ['C++', 'LangGraph'], years: '2' }]);
    assert.deepEqual(mock.insta.attempts, []);
    assert.match(s.state.note, /no more jobs in the verified search/);
    await d.msg({ type: 'instaSave', patch: { urlAi: s.defaults.urlAi } });
  });

  await step('Instahyre recovers when the list switches to recommendations after the search first appears', async () => {
    await instaRun('java', { maxRun: 1 }, { mode: 'lateRedirect' });
    const s = await instaWait();
    assert.deepEqual(mock.insta.attempts, ['j1'], s.state.note);
    assert.deepEqual(mock.insta.searches, [{ skills: ['Java', 'Spring Boot'], years: null }]);
  });

  await step('Instahyre stops before applying if a filter is dropped, the skill has no exact suggestion, Search Results stays inactive, or the modal changes lists', async () => {
    const link = (await instaStatus()).defaults.urlJava;
    for (const [urlJava, sim, expected] of [
      [link + '&location=Bangalore', { format: 'redirect' }, /additional filters/],
      [link + ',Unavailable', { format: 'redirect' }, /exact skill "Unavailable"/],
      [link, { format: 'redirect', mode: 'stale' }, /filtered Search Results list/],
      [link, { mode: 'drift' }, /Search Results list/],
    ]) {
      await instaRun('java', { urlJava }, sim);
      const s = await instaWait();
      assert.deepEqual(mock.insta.attempts, []);
      assert.match(s.state.note, expected);
    }
    await d.msg({ type: 'instaSave', patch: { urlJava: link } });
  });

  await step('Instahyre apply: Instahyre saying the apply limit is reached stops the run', async () => {
    await instaRun('java', {}, { mode: 'limit', limitAfter: 2 });
    const s = await instaWait();
    assert.equal(mock.insta.applies.length, 2);
    assert.match(s.state.note, /apply limit is reached/);
  });

  await step('Instahyre apply: a job that wants more than a click (a question) stops the run and says which', async () => {
    await instaRun('java', {}, { mode: 'more', needsMore: 'j9' });
    const s = await instaWait();
    assert.ok(!ids().includes('j9'), 'it did not pretend to apply');
    assert.match(s.state.note, /wanted more than a click for "Java Backend Developer"/);
    assert.ok(s.state.log.some((x) => x.action === 'stopped'));
  });

  await step('Instahyre apply: a login page stops it and says so', async () => {
    await instaRun('java', {}, { mode: 'login' });
    const s = await instaWait();
    assert.equal(mock.insta.applies.length, 0);
    assert.match(s.state.note, /log in/i);
  });

  await step('Instahyre apply: Stop ends a run in progress', async () => {
    await instaRun('java', { pauseMin: 2500, pauseMax: 3000 });
    await sleep(4000);
    const r = await d.msg({ type: 'instaStop' });
    assert.equal(r.result.kind, 'stopping');
    const s = await instaWait();
    assert.ok(mock.insta.applies.length >= 1 && mock.insta.applies.length < 7, `stopped part way (${mock.insta.applies.length})`);
    assert.match(s.state.note, /Stopped/);
  });

  await step('Instahyre apply: with the skip rules off it applies to everything the search shows; a daily cap holds', async () => {
    await instaRun('java', { skipRules: false });
    let s = await instaWait();
    assert.equal(mock.insta.applies.length, 10, 'all ten, Accenture and the QA job too');
    await instaRun('java', { maxDay: 3 }, {});
    s = await instaWait();
    assert.match(s.state.note, /cap of 3 applications for today/, s.state.note);
    await d.msg({ type: 'instaSave', patch: { skipRules: true, maxDay: 100 } });
  });

  if (process.env.NR_SHOT && d.screenshot) {
    await sleep(1600);
    await d.screenshot(process.env.NR_SHOT);
    console.log(`  (popup screenshot: ${process.env.NR_SHOT})`);
  }
  if (userTab) await d.closeTab(userTab).catch(() => {});
  return results;
}

// ---------------------------------------------------------------- main

const which = process.argv.slice(2).length ? process.argv.slice(2) : ['chrome', 'edge', 'firefox'];
const tmp = mkdtempSync(join(tmpdir(), 'naukri-refresher-e2e-'));
const cert = spawnSync(OPENSSL, ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(tmp, 'key.pem'), '-out', join(tmp, 'cert.pem'),
  '-days', '2', '-subj', '/CN=www.naukri.com', '-addext', 'subjectAltName=DNS:www.naukri.com,DNS:interviewplanprep.vercel.app,DNS:api.groq.com,DNS:www.instahyre.com'], { encoding: 'utf8' });
if (cert.status !== 0) throw new Error(`openssl failed: ${cert.error || cert.stderr}`);
const mock = await startMock({ key: readFileSync(join(tmp, 'key.pem')), cert: readFileSync(join(tmp, 'cert.pem')) });

const summary = [];
for (const name of which) {
  console.log(`\n=== ${name} ===`);
  let d;
  try {
    d = name === 'firefox' ? await firefox(tmp) : await chromium(name, tmp);
    console.log(`  ${d.version}`);
    const res = await suite(d, mock);
    summary.push({ name, pass: res.filter((r) => r.ok).length, fail: res.filter((r) => !r.ok).length });
  } catch (e) {
    console.log(`  ✘ could not start: ${e.message}`);
    if (d) console.log(d.logs().slice(-1500));
    summary.push({ name, pass: 0, fail: 1 });
  } finally {
    if (d) await d.close();
  }
}
await mock.close();
for (const image of ['chrome.exe', 'msedge.exe', 'firefox.exe']) killByProfile(image, tmp);
for (let i = 0; i < 5; i++) {
  try { rmSync(tmp, { recursive: true, force: true }); break; } catch { await sleep(1000); }
}
console.log('\n=== summary ===');
for (const s of summary) console.log(`  ${s.name}: ${s.pass} passed, ${s.fail} failed`);
process.exit(summary.some((s) => s.fail) ? 1 : 0);
