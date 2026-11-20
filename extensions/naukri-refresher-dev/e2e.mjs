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
import { startMock, EXPECT, RADAR_TOKEN, listing } from './mock-naukri.mjs';
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
    '--host-resolver-rules=MAP www.naukri.com 127.0.0.1,MAP interviewplanprep.vercel.app 127.0.0.1', '--ignore-certificate-errors',
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
    'network.dns.localDomains': 'www.naukri.com,interviewplanprep.vercel.app',
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
  cpSync(EXT_DIR, copy, { recursive: true });
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
  const step = async (name, fn) => {
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

  await step("find jobs: reads Naukri's results, opens each good-looking job's page, keeps the ones whose JD matches, sends them to the site", async () => {
    await setStore({ jobsDev: { pause: [60, 120], searches: ['java spring boot developer', 'software engineer', 'generative ai engineer'] } });
    const t0 = Date.now();
    const r = await d.msg({ type: 'jobsNow' });
    assert.equal(r.result.kind, 'started');
    const s = await waitRun(t0);
    assert.equal(s.lastRun.outcome, 'ok', JSON.stringify(s.lastRun));
    const pages = mock.searchPages();
    assert.ok(pages.some((p) => p.path === '/java-spring-boot-developer-jobs' && /experience=2/.test(p.search) && /jobAge=1/.test(p.search)), "Naukri's own filters in the URL");
    assert.ok(pages.some((p) => p.path === '/java-spring-boot-developer-jobs-2'), 'went on to page 2 after a full first page');
    assert.ok(!pages.some((p) => p.path === '/java-spring-boot-developer-jobs-3'), 'stopped after a short page');
    const posts = mock.state.radarPosts;
    assert.equal(posts.length, 1, 'one upload');
    assert.equal(posts[0].finder, 'naukri');
    assert.deepEqual(mock.state.radarPostAuth, ['finder'], 'sent with the token your site handed over');
    assert.equal(posts[0].summary.scope, 'both');
    const ids = posts[0].openings.map((o) => o.openingId);
    assert.equal(new Set(ids).size, ids.length, 'a listing found by two searches is sent once');
    assert.deepEqual([...ids].sort(), [...EXPECT.keep].sort(), 'kept exactly the listings that fit');
    for (const o of posts[0].openings) {
      assert.equal(o.profile, EXPECT.ai.includes(o.openingId) ? 'ai' : 'backend', `${o.title}: profile`);
      assert.ok(o.rank > 0 && o.rank <= 100 && o.postedAt && o.url.startsWith('https://www.naukri.com/job-listings-'), o.title);
    }
    const byId = Object.fromEntries(posts[0].openings.map((o) => [o.openingId, o]));
    assert.equal(byId[EXPECT.idOf(7)].pay.verdict, 'hidden', "a salary the employer hid is still read from Naukri's data");
    assert.equal(byId[EXPECT.idOf(9)].exp, 'unknown', 'a plain Software Engineer listing with no details is kept');
    assert.equal(byId[EXPECT.idOf(41)].coverage, 100, 'the AI search (loaded by XMLHttpRequest) was read too');
    // The JDs: every card that passed had its page opened; the JD decided.
    const jobPages = mock.jobPages().map((p) => p.path);
    assert.ok(jobPages.length >= EXPECT.keep.length, `opened ${jobPages.length} job pages`);
    assert.ok(!jobPages.some((p) => /android|net-developer|php/.test(p)), "a card ruled out by its title isn't opened");
    assert.ok(byId[EXPECT.idOf(61)], 'filler chips, but its JD is Java: kept');
    assert.ok(!byId[EXPECT.idOf(62)], 'fine chips, but its JD is .NET: dropped');
    assert.ok(s.reasons.some(([why]) => why === 'JD match under 60%'), JSON.stringify(s.reasons));
    assert.equal(byId[EXPECT.idOf(61)].jd, true);
    assert.ok(!byId[EXPECT.idOf(61)].missing.some((m) => /Salesforce|SAP|Go\b|Terraform/.test(m)), 'nice-to-haves and the company blurb left out');
    for (const id of EXPECT.cardOnly) assert.equal(byId[id].jd, false, "its page couldn't be read: judged by its card");
    assert.ok(s.daily.jds >= EXPECT.keep.length && s.jdSample && s.jdSample.via === 'api', JSON.stringify(s.jdSample));
    assert.ok(s.reasons.some(([why]) => why === 'Android role') && s.reasons.some(([why]) => why === "card's skills are another stack"), JSON.stringify(s.reasons));
    assert.equal(s.daily.kept.ai, EXPECT.ai.length);
    assert.equal(s.daily.kept.backend, EXPECT.keep.length - EXPECT.ai.length);
    assert.equal(naukriPosts().length, 0, 'never sends anything to Naukri (no apply, no form)');
    assert.equal((await d.naukriTabs()).filter((u) => /-jobs|job-listings/.test(u)).length, 0, 'its background tab is closed again');
  });

  await step('a later run reads one page per search and sends only the new listing that fits', async () => {
    mock.state.srpExtra = [listing(51, { title: 'Java Backend Developer', tagsAndSkills: 'Java,Spring Boot,Redis' }), listing(52, { title: 'iOS Developer' })];
    const before = mock.searchPages().length;
    const t0 = Date.now();
    await d.msg({ type: 'jobsNow' });
    await waitRun(t0);
    const posts = mock.state.radarPosts;
    assert.equal(posts.length, 2, 'one more upload');
    assert.deepEqual(posts[1].openings.map((o) => o.openingId), [EXPECT.idOf(51)]);
    assert.equal(mock.searchPages().length - before, 3, 'one page per search when little is new');
  });

  await step('Naukri asking "are you human?" pauses the finder at once; nothing is sent; Resume clears it', async () => {
    mock.state.srpMode = 'captcha';
    const t0 = Date.now();
    await d.msg({ type: 'jobsNow' });
    const s = await waitRun(t0);
    assert.ok(s.halted, 'paused');
    assert.equal(s.halted.short, 'Naukri asked for a check');
    assert.equal(mock.state.radarPosts.length, 2, 'nothing sent');
    assert.equal(mock.searchPages().filter((p) => p.t >= t0).length, 1, 'stopped at the first page that asked');
    mock.state.srpMode = 'ok';
    const r = await d.msg({ type: 'jobsResume' });
    assert.equal(r.halted, null);
  });

  await step('a check on a job page pauses it too; that job waits and is read first after Resume', async () => {
    mock.state.jobMode = 'captcha';
    mock.state.srpExtra = [listing(53, { title: 'Backend Developer', tagsAndSkills: 'Java,Spring Boot,PostgreSQL,Redis' })];
    const t0 = Date.now();
    await d.msg({ type: 'jobsNow' });
    let s = await waitRun(t0);
    assert.equal(s.halted && s.halted.short, 'Naukri asked for a check');
    assert.equal(s.queued, 1, 'the job waits');
    assert.equal(mock.state.radarPosts.length, 2, 'nothing sent');
    mock.state.jobMode = 'ok';
    await d.msg({ type: 'jobsResume' });
    const t1 = Date.now();
    await d.msg({ type: 'jobsNow' });
    s = await waitRun(t1);
    assert.equal(s.lastRun.outcome, 'ok', JSON.stringify(s.lastRun));
    const first = mock.state.requests.filter((r) => r.t >= t1 && (/^\/job-listings-/.test(r.path) || /-jobs(?:-\d+)?$/.test(r.path)))[0];
    assert.ok(first && first.path.endsWith(EXPECT.idOf(53)), `read its page first: ${first && first.path}`);
    assert.deepEqual(mock.state.radarPosts[2].openings.map((o) => o.openingId), [EXPECT.idOf(53)]);
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
      assert.equal(mock.state.radarPosts.length, 3, 'nothing sent');
      assert.equal(mock.searchPages().filter((p) => p.t >= t0).length, 0, 'not even searched');
    } finally {
      mock.state.radarMode = 'ok';
      await d.msg({ type: 'jobsResume' });
    }
  });

  await step('switching the finder on plans runs around 09, 11, 13, 15, 17 and 19 IST; off clears them', async () => {
    await d.msg({ type: 'jobsSave', patch: { enabled: true } });
    const s = await jobs();
    assert.ok(s.plan && s.plan.at > Date.now() - 1000, JSON.stringify(s.plan));
    const hm = istHM(s.plan.at);
    const mins = Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3));
    assert.ok([9, 11, 13, 15, 17, 19].some((h) => Math.abs(mins - h * 60) <= 7), hm);
    await d.msg({ type: 'jobsSave', patch: { enabled: false } });
    assert.equal((await jobs()).plan, null);
  });

  await step('popup shows the job finder in one line', async () => {
    const line = await d.evalExt("(async () => { await new Promise((r) => setTimeout(r, 1700)); return document.getElementById('jobsLine').textContent; })()");
    assert.equal(line, `Off · ${EXPECT.keep.length - EXPECT.ai.length + 2} Backend · ${EXPECT.ai.length} AI today`);
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
    const post = mock.state.radarPosts[before];
    assert.ok(post, 'it sent what it kept');
    assert.equal(post.summary.scope, 'ai');
    assert.deepEqual(post.openings.map((o) => o.openingId).sort(), [EXPECT.idOf(41), EXPECT.idOf(43)].sort());
    assert.ok(post.openings.every((o) => o.profile === 'ai'));
    await d.msg({ type: 'jobsSave', patch: { scope: 'both' } });
    await setStore({ jobsDev: null });
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
  '-days', '2', '-subj', '/CN=www.naukri.com', '-addext', 'subjectAltName=DNS:www.naukri.com,DNS:interviewplanprep.vercel.app'], { encoding: 'utf8' });
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
