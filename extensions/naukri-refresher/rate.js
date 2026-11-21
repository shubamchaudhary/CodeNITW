// The AI rating: the background part (the rules are in rate-lib.js).
//
// The job finder keeps the parser's top jobs per list and sends them to your site. Each one also
// waits here for a rating: an LLM on Groq reads its JD against your resume, rate-lib.js turns the
// answer into a 1–100 rating, and the job goes to your site again with it. It runs alongside a
// finder run (a few calls at a time, best-ranked job first) and keeps going for a few minutes after
// the run's sweep ends; "Rate waiting jobs now" in the settings runs it on its own.
//
// Keys: the same kind DeepLogLens uses (Groq, several, one per line in the settings). Each call
// starts at the next key in turn; a key that Groq says is at its limit rests until Groq says it may
// go again (retry-after, or its remaining tokens per minute), and one Groq rejects is left out.
// The keys stay in this browser (storage.local) and are only ever sent to api.groq.com. Your
// resumes come from resume.local.json next to this file (made from your PDFs by
// naukri-refresher-dev/make-job-profile.mjs, without your name and contact lines; git never sees it).

import { RATE, buildInput, requestBody, outputText, usageOf, scoreRating, rateHash, keyHint, parseWait, scrub } from './rate-lib.js';
import { byParser } from './jobs-lib.js';

const ext = globalThis.browser ?? globalThis.chrome;
export const GROQ_MATCH = 'https://api.groq.com/*';
const QK = 'jobsRateQ';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

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

export async function hasGroqAccess() {
  return ext.permissions.contains({ origins: [GROQ_MATCH] }).catch(() => false);
}

/**
 * One rating request on one key. → { ok:true, answer, usage, limits } or { ok:false, kind, msg, wait?, limits? }
 * where kind is key (Groq rejected this key), rate (this key is at a limit: rest `wait` ms), model
 * (Groq doesn't serve the model), answer (not the JSON asked for), big (too large for the key's
 * per-minute budget), transient (network, timeout, 5xx) or bad (any other refusal).
 */
export async function callGroq({ key, model, input, timeoutMs = RATE.timeoutMs }) {
  let res;
  try {
    res = await fetch(`${RATE.api}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify(requestBody({ model, input })),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    return { ok: false, kind: 'transient', msg: `couldn't reach Groq (${e && e.name === 'TimeoutError' ? 'no answer in time' : scrub(e && e.message)})` };
  }
  const h = (n) => res.headers.get(n);
  // x-ratelimit-*-requests are per day, x-ratelimit-*-tokens per minute (console.groq.com/docs/rate-limits).
  const limits = {
    requestsLeft: num(h('x-ratelimit-remaining-requests')), requestsReset: parseWait(h('x-ratelimit-reset-requests')),
    tokensLeft: num(h('x-ratelimit-remaining-tokens')), tokensReset: parseWait(h('x-ratelimit-reset-tokens')),
  };
  const j = await res.json().catch(() => null);
  const e = (j && j.error) || {};
  const said = scrub(typeof e === 'string' ? e : e.message || (j && j.message) || '');
  const code = String(e.code || e.type || '');
  const tail = said ? `: ${said}` : '';
  if (res.status === 401 || res.status === 403) return { ok: false, kind: 'key', msg: `Groq rejected a key (${res.status}${tail})` };
  if (res.status === 429) {
    const day = /per day|\(RPD\)|\(TPD\)/i.test(said);
    const m = said.match(/try again in ([0-9hms.]+)/i);
    const wait = parseWait(h('retry-after')) ?? (m && parseWait(m[1].replace(/\.$/, ''))) ?? (day ? 3_600_000 : 60_000);
    return { ok: false, kind: 'rate', wait, day, limits, msg: `a key is at Groq's ${day ? 'daily' : 'per-minute'} limit` };
  }
  if (res.status === 413) return { ok: false, kind: 'big', msg: 'the request is larger than a key may send in a minute' };
  if (res.status === 404 || /model_not_found|model_decommissioned|does not exist|decommissioned/i.test(`${code} ${said}`)) {
    return { ok: false, kind: 'model', msg: `Groq doesn't serve the model "${model}" (${res.status}${tail})` };
  }
  if (res.status === 400 && /json_validate_failed|schema|json/i.test(`${code} ${said}`)) return { ok: false, kind: 'answer', msg: `the model's JSON didn't hold up (${said || code})` };
  if (res.status >= 500) return { ok: false, kind: 'transient', msg: `Groq answered ${res.status}` };
  if (!res.ok) return { ok: false, kind: 'bad', msg: `Groq refused the request (${res.status}${tail})` };
  const usage = usageOf(j);
  let answer = null;
  try { answer = JSON.parse(outputText(j)); } catch { answer = null; }
  if (!answer || typeof answer !== 'object') return { ok: false, kind: 'answer', msg: "the model's answer wasn't the JSON asked for", usage, limits };
  return { ok: true, answer, usage, limits };
}

/**
 * The keys, taken in turn: each one rests while Groq says it's at a limit; a rejected one is left
 * out. A key that hasn't answered yet gets one call at a time, so a bad key costs one call.
 */
export function keyPool(keys, start = Math.floor(Math.random() * Math.max(1, keys.length))) {
  const slots = keys.map((key) => ({ key, hint: keyHint(key), until: 0, dead: null, busy: 0, proven: false }));
  let turn = start % Math.max(1, slots.length);
  return {
    slots,
    take(now = Date.now()) {
      for (let i = 0; i < slots.length; i++) {
        const s = slots[(turn + i) % slots.length];
        if (!s.dead && s.until <= now && (s.proven || s.busy === 0)) {
          turn = (turn + i + 1) % slots.length;
          return s;
        }
      }
      return null;
    },
    /** How long until a key is free again (Infinity: none left). */
    wait(now = Date.now()) {
      const live = slots.filter((s) => !s.dead);
      return live.length ? Math.max(0, Math.min(...live.map((s) => s.until)) - now) : Infinity;
    },
    /** What Groq's headers say about a key's budget: rest it until it can take another call. */
    note(slot, limits, now = Date.now()) {
      if (!limits) return;
      if (limits.tokensLeft != null && limits.tokensLeft < RATE.callTokens) slot.until = Math.max(slot.until, now + (limits.tokensReset ?? 60_000));
      if (limits.requestsLeft === 0) slot.until = Math.max(slot.until, now + (limits.requestsReset ?? 3_600_000));
    },
  };
}

/** "Check the keys": what Groq says about each one (never a key itself), and whether it serves the model. */
export async function checkKeys(keys, model) {
  if (!keys.length) return { ok: false, short: 'no Groq key saved', keys: [] };
  if (!(await hasGroqAccess())) return { ok: false, short: 'no access to api.groq.com yet (press Save keys here to allow it)', keys: [] };
  const out = [];
  for (const key of keys) {
    let status = 0;
    let ids = [];
    try {
      const res = await fetch(`${RATE.api}/models`, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(20_000) });
      status = res.status;
      const j = await res.json().catch(() => null);
      ids = j && Array.isArray(j.data) ? j.data.map((m) => m && m.id).filter(Boolean) : [];
    } catch { status = 0; }
    out.push({
      hint: keyHint(key),
      ok: status === 200 && ids.includes(model),
      status,
      msg: status === 200 ? (ids.includes(model) ? 'works' : `works, but Groq doesn't list ${model} for it`) : status === 0 ? "couldn't reach Groq" : status === 401 || status === 403 ? 'rejected' : `answered ${status}`,
    });
  }
  const good = out.filter((k) => k.ok).length;
  return { ok: good > 0, keys: out, model, short: `${good} of ${out.length} key${out.length === 1 ? '' : 's'} work with ${model}` };
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
 * Rates `queue` (shared with a finder run, which adds jobs as it keeps them), best-ranked first, a
 * few at a time over the keys, until it's empty, a list reaches its daily cap, or every key is at
 * its limit.
 *   ctx: { keys, model, resumes, perDay, counts (the day's tally, mutated), onRated(item, ai) }
 * → { stop(): Promise, drain(ms): Promise, problem: why it gave up, if it did }
 */
export function startRater(queue, ctx) {
  const { model, resumes, perDay, counts, onRated } = ctx;
  const pool = ctx.pool || keyPool(ctx.keys);
  const inflight = new Set();
  const going = { backend: 0, ai: 0 }; // being rated right now, per list: they count toward the cap
  let stopping = false;
  let deadline = Infinity;
  let problem = null;
  let failsInRow = 0;
  const capped = (p) => (counts.rated[p] || 0) + (going[p] || 0) >= perDay;
  const perKey = (slot) => {
    counts.keys = counts.keys || {};
    return counts.keys[slot.hint] || (counts.keys[slot.hint] = { calls: 0, ok: 0, last: '' });
  };

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

  async function rateOne(item, slot) {
    const resume = resumeFor(resumes, item.profile);
    const input = buildInput({ resume, job: item.job, text: item.text, skills: item.skills || [] });
    slot.busy += 1;
    const r = await callGroq({ key: slot.key, model, input }).finally(() => { slot.busy -= 1; });
    if (r.ok || r.kind === 'answer') slot.proven = true;
    const k = perKey(slot);
    k.calls += 1;
    counts.calls += 1;
    pool.note(slot, r.limits);
    if (r.usage) {
      counts.tokens.input += r.usage.input;
      counts.tokens.cached += r.usage.cached;
      counts.tokens.output += r.usage.output;
    }
    if (r.ok) {
      const jd = `${item.job.title}\n${(item.skills || []).join(', ')}\n${item.text}`;
      const ai = scoreRating(r.answer, { resume, jd, profile: item.profile });
      if (ai) {
        failsInRow = 0;
        k.ok += 1;
        k.last = 'ok';
        drop(item);
        counts.rated[item.profile] = (counts.rated[item.profile] || 0) + 1;
        onRated(item, { ...ai, t: Date.now() });
        return;
      }
      r.ok = false;
      r.kind = 'answer';
      r.msg = "the model's answer had no requirements list";
    }
    k.last = r.msg;
    counts.last = { t: Date.now(), kind: r.kind, msg: r.msg };
    // A key's own trouble: that key rests or goes, and the job is tried again on another one.
    if (r.kind === 'key') { slot.dead = r.msg; return; }
    if (r.kind === 'rate') { slot.until = Math.max(slot.until, Date.now() + r.wait); return; }
    if (r.kind === 'model') { problem = r; return; }
    counts.fails += 1;
    if (r.kind === 'transient') slot.until = Math.max(slot.until, Date.now() + 5_000);
    item.tries = (item.tries || 0) + 1;
    if (item.tries >= 2 || r.kind === 'big') drop(item); // twice wrong: given up on, it stays unrated
    failsInRow += 1;
    if (failsInRow >= 4) problem = { kind: 'transient', msg: `${r.msg} (4 in a row; the next run tries again)` };
  }

  async function loop() {
    while (!problem && Date.now() < deadline) {
      const item = pick();
      if (!item) {
        if (stopping) return;
        await sleep(1000);
        continue;
      }
      const slot = pool.take();
      if (!slot) {
        const w = pool.wait();
        if (w === Infinity) { problem = { kind: 'key', msg: 'Groq rejected every key' }; return; }
        if (w > RATE.maxWaitMs) { problem = { kind: 'quota', msg: `every Groq key is at its limit for ${model}; the next run carries on` }; return; }
        await sleep(Math.min(w + 250, Math.max(0, deadline - Date.now())));
        continue;
      }
      inflight.add(item.id);
      going[item.profile] = (going[item.profile] || 0) + 1;
      try {
        await rateOne(item, slot);
      } catch (e) {
        problem = { kind: 'transient', msg: `rating error: ${scrub(e && e.message)}` };
      } finally {
        inflight.delete(item.id);
        going[item.profile] -= 1;
      }
    }
  }
  const loops = Array.from({ length: Math.max(1, Math.min(RATE.concurrency, pool.slots.length)) }, () => loop());
  const end = (ms) => { stopping = true; deadline = Date.now() + ms; return Promise.all(loops); };
  return {
    get problem() { return problem; },
    pool,
    stop: () => end(0),
    drain: (ms = RATE.drainMs) => end(ms),
  };
}
