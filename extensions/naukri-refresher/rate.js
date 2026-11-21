// The AI rating: the background part (the rules are in rate-lib.js).
//
// The job finder keeps the parser's top jobs per list and sends them to your site. Each one also
// waits here for a rating: Grok (xAI) reads its JD against your resume, rate-lib.js turns the
// answer into a 1–100 rating, and the job goes to your site again with it. It runs alongside a
// finder run (two calls at a time, best-ranked job first) and keeps going for a few minutes after
// the run's sweep ends; "Rate waiting jobs now" in the settings runs it on its own.
//
// One key, used within its own limits. It stays in this browser (storage.local) and is only ever
// sent to api.x.ai. Your resumes come from resume.local.json next to this file (made from your
// PDFs by naukri-refresher-dev/make-job-profile.mjs, without your name and contact lines; git
// never sees it). Each request asks xAI not to store it (store: false).

import { RATE, buildInput, requestBody, outputText, usageOf, scoreRating, rateHash, scrub } from './rate-lib.js';
import { byParser } from './jobs-lib.js';

const ext = globalThis.browser ?? globalThis.chrome;
export const XAI_API = 'https://api.x.ai/v1';
export const XAI_MATCH = 'https://api.x.ai/*';
const QK = 'jobsRateQ';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Your two resumes for the rating, or null when resume.local.json isn't there (or the test knob's). */
export async function loadResumes(dev = {}) {
  let r = null;
  if (dev && dev.resume && typeof dev.resume === 'object') r = { ...dev.resume, from: 'test' };
  else {
    try {
      const res = await fetch(ext.runtime.getURL('resume.local.json'));
      if (res.ok) r = await res.json();
    } catch { r = null; }
  }
  if (!r || typeof r.sde !== 'string' || typeof r.genai !== 'string' || r.sde.length < 200 || r.genai.length < 200) return null;
  return { sde: r.sde, genai: r.genai, generated: r.generated || null, from: r.from || 'file', hash: { backend: rateHash(r.sde), ai: rateHash(r.genai) } };
}
export const resumeFor = (resumes, profile) => (profile === 'ai' ? resumes.genai : resumes.sde);

export async function hasXaiAccess() {
  return ext.permissions.contains({ origins: [XAI_MATCH] }).catch(() => false);
}

/**
 * One rating request. → { ok:true, answer, usage } or { ok:false, kind, msg, usage? } where kind is
 * key (rejected: rating stops until a new key is saved), credits (out of credits or over a spending
 * limit: stops for the day), model (unknown model), rate (too many requests), transient, answer
 * (not the JSON asked for), bad (any other refusal).
 */
export async function callGrok({ key, model, input, timeoutMs = RATE.timeoutMs }) {
  let res;
  try {
    res = await fetch(`${XAI_API}/responses`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify(requestBody({ model, input })),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    return { ok: false, kind: 'transient', msg: `couldn't reach xAI (${e && e.name === 'TimeoutError' ? 'no answer in time' : scrub(e && e.message)})` };
  }
  const j = await res.json().catch(() => null);
  const err = j && (typeof j.error === 'string' ? j.error : j.error && j.error.message) || (j && (j.message || j.detail || j.code)) || '';
  const said = scrub(err);
  const tail = said ? `: ${said}` : '';
  if (res.status === 401 || res.status === 403) {
    if (/credit|spend|billing|balance|quota|payment/i.test(said)) return { ok: false, kind: 'credits', msg: `xAI says the account can't pay for more (${res.status}${tail})` };
    return { ok: false, kind: 'key', msg: `xAI rejected the key (${res.status}${tail})` };
  }
  if (res.status === 402) return { ok: false, kind: 'credits', msg: `xAI says the account is out of credits (402${tail})` };
  if (res.status === 429) {
    if (/credit|spend|billing|balance|quota|payment|limit reached/i.test(said)) return { ok: false, kind: 'credits', msg: `xAI says the account can't pay for more (429${tail})` };
    return { ok: false, kind: 'rate', msg: 'xAI said too many requests (429)' };
  }
  if (res.status === 404 || (res.status === 400 && /model/i.test(said))) return { ok: false, kind: 'model', msg: `xAI doesn't know the model "${model}" (${res.status}${tail})` };
  if (res.status >= 500) return { ok: false, kind: 'transient', msg: `xAI answered ${res.status}` };
  if (!res.ok) return { ok: false, kind: 'bad', msg: `xAI refused the request (${res.status}${tail})` };
  const usage = usageOf(j, model);
  let answer = null;
  try { answer = JSON.parse(outputText(j)); } catch { answer = null; }
  if (!answer || typeof answer !== 'object') return { ok: false, kind: 'answer', msg: "xAI's answer wasn't the JSON asked for", usage };
  return { ok: true, answer, usage };
}

/** "Check the key": what xAI says about it (never the key itself) and whether the model is there. */
export async function checkKey(key, model) {
  if (!key) return { ok: false, short: 'no key saved' };
  if (!(await hasXaiAccess())) return { ok: false, short: 'no access to api.x.ai yet (Save the key here to allow it)' };
  const get = async (path) => {
    try {
      const res = await fetch(`${XAI_API}${path}`, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(20_000) });
      return { status: res.status, j: await res.json().catch(() => null) };
    } catch (e) {
      return { status: 0, err: scrub(e && e.message) };
    }
  };
  const k = await get('/api-key');
  if (k.status === 0) return { ok: false, short: `couldn't reach xAI (${k.err})` };
  if (k.status === 401 || k.status === 403) return { ok: false, short: `xAI rejected the key (${k.status})` };
  if (k.status !== 200 || !k.j) return { ok: false, short: `xAI answered ${k.status}` };
  const blocked = !!(k.j.api_key_blocked || k.j.api_key_disabled || k.j.team_blocked);
  const m = await get('/models');
  const list = (m.j && Array.isArray(m.j.data) ? m.j.data : Array.isArray(m.j && m.j.models) ? m.j.models : []);
  const entry = list.find((x) => x && (x.id === model || (Array.isArray(x.aliases) && x.aliases.includes(model))));
  // Prices come in USD cents per 100 million tokens: 12500 is $1.25 per million.
  const per = (v) => (Number.isFinite(Number(v)) ? Number(v) / 10_000 : null);
  return {
    ok: !blocked && !!entry,
    name: scrub(k.j.name || ''),
    blocked,
    model,
    modelFound: !!entry,
    prices: entry ? { input: per(entry.prompt_text_token_price), cached: per(entry.cached_prompt_text_token_price), output: per(entry.completion_text_token_price) } : null,
    short: blocked ? 'xAI says this key or its team is blocked or disabled' : !entry ? `the key works, but xAI doesn't list the model "${model}" for it` : 'xAI accepts the key',
  };
}

// ---------------------------------------------------------------- the queue between runs

/** Jobs waiting for a rating (with their JD text), as the last run left them. */
export async function loadQueue() {
  const q = (await ext.storage.local.get(QK))[QK];
  return Array.isArray(q && q.items) ? q.items.filter((i) => i && i.id && i.text) : [];
}

/** Keep what's still worth rating: in the last 48 hours, not rated yet, best first, a few hundred at most. */
export function pruneQueue(items, { now, rated = {}, hash = null, maxAgeH = 48 }) {
  const since = now - maxAgeH * 3_600_000;
  const seen = new Set();
  return items
    .filter((i) => {
      if (!i || !i.id || seen.has(i.id) || (i.post || 0) < since) return false;
      seen.add(i.id);
      const c = rated[i.id];
      return !(c && hash && c.h === hash[i.profile]);
    })
    .sort((a, b) => byParser(a.p || {}, b.p || {}))
    .slice(0, RATE.queueMax);
}

export async function saveQueue(items) {
  await ext.storage.local.set({ [QK]: { t: Date.now(), items } });
}

// ---------------------------------------------------------------- the worker

/**
 * Rates `queue` (shared with a finder run, which adds jobs as it keeps them), best-ranked first,
 * RATE.concurrency at a time, until it's empty or a list reaches its daily cap.
 *   ctx: { key, model, resumes, perDay, counts (the day's tally, mutated), onRated(item, ai) }
 * → { stop(): Promise, drain(ms): Promise, problem: the reason it gave up, if it did }
 */
export function startRater(queue, ctx) {
  const { key, model, resumes, perDay, counts, onRated } = ctx;
  const inflight = new Set();
  let stopping = false;
  let deadline = Infinity;
  let problem = null;
  let failsInRow = 0;
  const capped = (p) => (counts.rated[p] || 0) >= perDay;

  const pick = () => {
    let best = -1;
    for (let i = 0; i < queue.length; i++) {
      const it = queue[i];
      if (inflight.has(it.id) || capped(it.profile)) continue;
      if (best < 0 || byParser(it.p || {}, queue[best].p || {}) < 0) best = i;
    }
    return best < 0 ? null : queue[best];
  };
  const drop = (item) => {
    const i = queue.indexOf(item);
    if (i >= 0) queue.splice(i, 1);
  };

  async function rateOne(item) {
    const resume = resumeFor(resumes, item.profile);
    const input = buildInput({ resume, job: item.job, text: item.text, skills: item.skills || [] });
    let r = await callGrok({ key, model, input });
    if (!r.ok && (r.kind === 'transient' || r.kind === 'rate') && !stopping) {
      await sleep(r.kind === 'rate' ? 20_000 : 4_000);
      r = await callGrok({ key, model, input });
    }
    counts.calls += 1;
    if (r.usage) {
      counts.usd += r.usage.usd;
      counts.tokens.input += r.usage.input;
      counts.tokens.cached += r.usage.cached;
      counts.tokens.output += r.usage.output;
    }
    if (r.ok) {
      const jd = `${item.job.title}\n${(item.skills || []).join(', ')}\n${item.text}`;
      const ai = scoreRating(r.answer, { resume, jd, profile: item.profile });
      if (ai) {
        failsInRow = 0;
        drop(item);
        counts.rated[item.profile] = (counts.rated[item.profile] || 0) + 1;
        onRated(item, { ...ai, t: Date.now() });
        return;
      }
      r = { ok: false, kind: 'answer', msg: "xAI's answer didn't have the requirements list" };
    }
    counts.fails += 1;
    counts.last = { t: Date.now(), kind: r.kind, msg: r.msg };
    if (r.kind === 'key' || r.kind === 'credits' || r.kind === 'model') { problem = r; return; }
    item.tries = (item.tries || 0) + 1;
    if (item.tries >= 2) drop(item); // twice wrong: given up on, it stays unrated
    failsInRow += 1;
    if (failsInRow >= 3) problem = { kind: 'transient', msg: `${r.msg} (3 in a row; the next run tries again)` };
  }

  async function loop() {
    while (!problem && Date.now() < deadline) {
      const item = pick();
      if (!item) {
        if (stopping) return;
        await sleep(1000);
        continue;
      }
      inflight.add(item.id);
      try { await rateOne(item); } catch (e) { problem = { kind: 'transient', msg: `rating error: ${scrub(e && e.message)}` }; } finally { inflight.delete(item.id); }
    }
  }
  const loops = Array.from({ length: RATE.concurrency }, () => loop());
  const end = (ms) => { stopping = true; deadline = Date.now() + ms; return Promise.all(loops); };
  return {
    get problem() { return problem; },
    stop: () => end(0),
    drain: (ms = RATE.drainMs) => end(ms),
  };
}
