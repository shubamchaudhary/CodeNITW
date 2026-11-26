import { createHmac, timingSafeEqual } from "crypto";
import { gunzipSync, gzipSync } from "zlib";
import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { adminConfigured, db, verifiedUser } from "./_lib/admin.mjs";
import { OWNER_EMAIL } from "./_lib/visits.mjs";
import { payKey, confidentPay, payRecord, payFresh } from "../extensions/naukri-refresher/pay-lib.js";

// The job radar's openings — Firestore is their permanent record.
// (The radar itself, scripts/radar/run.mjs, runs on the owner's PC — never in
// GitHub Actions.)
//
//   POST  Authorization: Bearer <RADAR_INGEST_TOKEN>
//         body { summary, openings: [{ company, openingId, title, url, postedAt, seenSince, … }],
//                remove: [{ company, openingId }] }
//         Every opening a run found. New ones are created, known ones updated
//         (lastSeen, pay, score…). `remove` lists openings the run saw but its
//         rules now reject (experience, skills match, pay); any stored copy is
//         deleted. Then it runs the DELETE below, so the collection only ever
//         holds the last KEEP_DAYS days.
//         body { finder: "naukri", summary, openings, remove } is the Naukri job finder
//         (extensions/naukri-refresher): same openings plus rank/profile/coverage
//         and an AI rating (`ai`); its `remove` takes off finder openings its rules
//         now turn down (never the radar's); its run kept as latestFinderRun (and per list it
//         searched for, finderRuns.backend|ai|both), its openings kept
//         FINDER_KEEP_DAYS. { finder: "naukri", check: true } only answers
//         { ok, finder: true } (the finder asks before uploading; writes nothing).
//         { finder: "naukri", reset: true } is "Start over": deletes every finder
//         opening (both lists, never the radar's) and keeps the time; { finder:
//         "naukri", state: true } answers { ok, finder: true, resetAt } with it,
//         so the other browser's finder starts over too.
//         The finder may use its own token instead of RADAR_INGEST_TOKEN: it can
//         only send finder openings. { finder: "naukri", pair: true } with the
//         owner's Firebase ID token answers { ok, finder: true, token } — the site's
//         Job tracker page hands that token to the extension, so nothing is pasted.
//
//         Company pay (the same tokens): { pay: "get", keys: ["acme", …] } answers { found: { key: record } }
//         from the Firestore collection companyPay (what a company pays a software engineer with about
//         2 years in India, in LPA); { pay: "put", entries: [{ company, lo, hi, med, n, sources, src,
//         same }] } saves each one that has enough evidence (pay-lib.js confidentPay, checked here again)
//         and says why for the rest. The finder and the radar look here first, then on the internet,
//         and save only what they are sure of.
//
//   DELETE Authorization: Bearer <RADAR_INGEST_TOKEN>
//         Deletes openings that opened more than KEEP_DAYS days ago, and run
//         logs as old. ?days=N for another age (at least 1).
//
//   GET   Authorization: Bearer <RADAR_READ_TOKEN>, or the owner's Firebase ID token
//         ?limit=50 (1–200)  ?cursor=<nextCursor from the previous page>
//         ?since=2026-10-01 (opened on or after; a date or epoch ms)
//         → { openings, nextCursor, total (first page only), summary (latest run),
//             finderSummary (the job finder's latest run), finderRuns (its latest per list) }
//         Newest opening first.
//         ?all=1 → every opening in one response, from the snapshot below
//         (one Firestore read instead of a query per page); falls back to the
//         first page, with its nextCursor, if there's no snapshot.
//
// The data only changes when something uploads, so each POST and DELETE writes
// a snapshot of every opening, newest first, gzipped into appCache/radarOpenings
// (and radarOpenings-1, -2… when it's larger than one document holds). The
// radar's POST and the DELETE rebuild it from the collection. The job finder
// uploads every few minutes during a run, from two browsers, so its POST works
// from the snapshot instead: it reads it, writes its openings, prunes what's old
// and writes the snapshot back, all in one transaction. That costs a handful of
// document reads per upload instead of one per stored opening (Firestore's free
// quota is 50,000 reads a day for the whole site).
//
// One document per opening in radarOpenings, keyed company:openingId:timestamp:
//   company   — the company name as a slug ("amazon")
//   openingId — the job's own id on its board (Greenhouse/Workday/Naukri id…)
//   timestamp — when it opened, epoch ms: the posting date when a source gives
//               one, otherwise when the radar first saw it.
// The timestamp is fixed when the opening is first stored: a later run finds
// it by company:openingId (the `base` field) and updates that document, so a
// changed posting date or a second source never makes a duplicate.
//
// "When it opened" for a job with no posting date is the day the PC's radar
// first saw it (seenSince), so a long-listed job that was pruned isn't stored
// again as new: anything that opened before the keep window is skipped.

const OPENINGS = "radarOpenings";
const RUNS = "radarRuns";
const KEEP_DAYS = 15;
// The Naukri job finder (the browser extension) uploads with { finder: "naukri" }. Its openings
// are "posted today" lists, so they're kept FINDER_KEEP_DAYS; the radar's own uploads never
// delete or overwrite them (a radar run only refreshes their lastSeen and sources).
const FINDER = "naukri";
const FINDER_KEEP_DAYS = 3;
const ACTIVE_DAYS = 7; // seen by a run in the last week → still open
const MAX_OPENINGS = 2000;
const DAY = 86400000;

const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Every opening in one answer can pass Vercel's 4.5 MB limit on a function's response, so a large
// one goes gzipped (the browser unpacks it by itself; JSON shrinks about five times).
export function compressed(request, body) {
  const text = JSON.stringify(body);
  if (text.length < 256 * 1024 || !/\bgzip\b/i.test(request.headers.get("accept-encoding") || "")) {
    return new Response(text, { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  }
  return new Response(gzipSync(Buffer.from(text)), {
    headers: { "Content-Type": "application/json", "Content-Encoding": "gzip", "Cache-Control": "no-store", Vary: "Accept-Encoding" },
  });
}

// ── Snapshot: every opening, gzipped, over as many documents as it needs ────
const SNAP = "radarOpenings";
const PART_MAX = 900 * 1024; // a Firestore document holds at most 1 MiB
const MAX_PARTS = 8;
const partRef = (i) => db().collection("appCache").doc(i ? `${SNAP}-${i}` : SNAP);
const partRefs = (n) => Array.from({ length: Math.max(0, n - 1) }, (_, i) => partRef(i + 1));
// Newest first, ties by document id (as the collection query orders them).
const byNewest = (a, b) => (b.openedAt || 0) - (a.openedAt || 0) || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);

// The snapshot's documents: the first holds how many parts there are; every part carries the same rev.
export function snapshotParts(openings, rev, now) {
  const data = gzipSync(Buffer.from(JSON.stringify(openings.map(listed)))).toString("base64");
  const n = Math.max(1, Math.ceil(data.length / PART_MAX));
  if (n > MAX_PARTS) return [{ tooBig: true, at: now, rev }]; // far more than is ever kept: readers page instead
  return Array.from({ length: n }, (_, i) => ({
    data: data.slice(i * PART_MAX, (i + 1) * PART_MAX),
    at: now,
    rev,
    ...(i === 0 ? { parts: n, count: openings.length } : {}),
  }));
}

// The documents' contents, first part first → the openings, or null (none, too big, or parts from different writes).
export function snapshotFrom(docs) {
  const [main] = docs;
  if (!main || !main.data) return null;
  const n = main.parts || 1;
  const parts = docs.slice(0, n);
  if (parts.length < n || parts.some((p) => !p || typeof p.data !== "string" || (p.rev ?? null) !== (main.rev ?? null))) return null;
  return JSON.parse(gunzipSync(Buffer.from(parts.map((p) => p.data).join(""), "base64")).toString("utf8"));
}

function setSnapshot(tx, openings, rev, now) {
  snapshotParts(openings, rev, now).forEach((p, i) => tx.set(partRef(i), p));
}

// Rebuilt from the collection. The snapshot is written only if no finder upload changed it while
// the collection was being read (its rev); otherwise the collection is read again.
async function writeSnapshot(now) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = await partRef(0).get();
    const rev0 = (before.exists && before.get("rev")) || 0;
    const snap = await db().collection(OPENINGS).orderBy("openedAt", "desc").orderBy(FieldPath.documentId(), "desc").get();
    const openings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const written = await db().runTransaction(async (tx) => {
      const main = await tx.get(partRef(0));
      const rev = (main.exists && main.get("rev")) || 0;
      if (rev !== rev0) return false;
      setSnapshot(tx, openings, rev + 1, now);
      return true;
    });
    if (written) return;
  }
  console.error("radar: the snapshot kept changing while it was rebuilt; left as it is");
}

async function readSnapshot() {
  const main = await partRef(0).get();
  if (!main.exists || !main.get("data")) return null;
  const n = main.get("parts") || 1;
  const rest = n > 1 ? await db().getAll(...partRefs(n)) : [];
  return snapshotFrom([main.data(), ...rest.map((d) => (d.exists ? d.data() : null))]);
}

function tokenMatches(request, secret) {
  const m = /^Bearer (.+)$/.exec(request.headers.get("authorization") || "");
  if (!secret || !m) return false;
  const a = Buffer.from(m[1]);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

// The job finder's own token, derived from RADAR_INGEST_TOKEN (nothing new to configure; a new
// ingest token makes a new finder token too). It can only send finder openings.
export function finderToken(secret) {
  return secret ? `nrf1.${createHmac("sha256", secret).update("naukri-finder:v1").digest("base64url")}` : null;
}

const isOwner = (user) => !!user && (user.email || "").toLowerCase() === OWNER_EMAIL && user.email_verified === true;
const FINDER_SCOPES = new Set(["backend", "ai", "both"]);

const slug = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
const cleanId = (s) => String(s || "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : undefined);
const num = (v) => (typeof v === "number" && isFinite(v) ? v : undefined);

// The fields an opening may carry, each a sane size; undefined ones are left out.
function fields(o) {
  const out = {
    title: str(o.title, 200),
    location: str(o.location, 160),
    url: str(o.url, 600),
    source: str(o.source, 20),
    ats: str(o.ats, 20),
    postedAt: str(o.postedAt, 10),
    minYoe: num(o.minYoe),
    maxYoe: num(o.maxYoe),
    exp: str(o.exp, 12),
    pay: o.pay && typeof o.pay === "object" ? { verdict: str(o.pay.verdict, 12) || "unknown", text: str(o.pay.text, 160) || "" } : undefined,
    matchScore: num(o.matchScore),
    matched: Array.isArray(o.matched)
      ? o.matched.slice(0, 10).map((m) => ({ skill: str(m?.skill, 40) || "", type: str(m?.type, 8) || "have" })).filter((m) => m.skill)
      : undefined,
    missing: Array.isArray(o.missing) ? o.missing.slice(0, 6).map((s) => str(s, 40)).filter(Boolean) : undefined,
    snippet: str(o.snippet, 260) || undefined,
    // The Naukri job finder's own fields (extensions/naukri-refresher): which of the owner's two
    // Naukri profiles to apply with, its 0–100 rank, and how much of the job's tech is covered.
    finder: o.finder === FINDER ? FINDER : undefined,
    rank: num(o.rank),
    profile: o.profile === "ai" || o.profile === "backend" ? o.profile : undefined,
    coverage: num(o.coverage),
    skillsHave: num(o.skillsHave),
    skillsTotal: num(o.skillsTotal),
    rating: num(o.rating),
    reviews: num(o.reviews),
    postedTime: num(o.postedTime),
    // Whether its skills come from the job's own JD (or only its card), how much of it is AI work,
    // and whether the JD named too few technologies to judge on a share.
    jd: typeof o.jd === "boolean" ? o.jd : undefined,
    aiShare: num(o.aiShare),
    fewSkills: o.fewSkills === true ? true : undefined,
    // Its AI rating (the finder's second pass: an LLM read the JD against the resume).
    ai: aiOf(o.ai),
    // What the rating's LLM call was sent and answered (the card's "Prompt and answer"). Big, so it
    // stays out of the snapshot and the paged list: GET ?debug=<id> reads it for one opening.
    dbg: dbgOf(o.dbg),
    // How you apply: on Naukri, or on the company's own site (and that site's link).
    apply: o.apply === "naukri" || o.apply === "company" ? o.apply : undefined,
    applyUrl: typeof o.applyUrl === "string" && /^https?:\/\//.test(o.applyUrl) ? str(o.applyUrl, 600) : undefined,
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined));
}

// The AI rating: 1–100 and what it rests on. Every field is always there, so a later rating
// replaces all of an earlier one (Firestore merges maps field by field).
function aiOf(a) {
  if (!a || typeof a !== "object") return undefined;
  const s = Math.round(Number(a.s));
  if (!(s >= 1 && s <= 100)) return undefined;
  const list = (v, n) => (Array.isArray(v) ? v.slice(0, n).map((x) => str(x, 60)).filter(Boolean) : []);
  const m = Array.isArray(a.m) && a.m.length === 2 ? a.m.map((x) => num(x) ?? 0) : [0, 0];
  return {
    s,
    m,
    ...(a.v >= 5 && { match: a.match === true }),
    ...(Array.isArray(a.supporting) && a.supporting.length === 2 && { supporting: a.supporting.map(n => num(n) ?? 0) }),
    have: list(a.have, 5),
    part: list(a.part, 3),
    miss: list(a.miss, 4),
    role: str(a.role, 12) || "other",
    lvl: str(a.lvl, 8) || "mid",
    yrs: num(a.yrs) ?? null,
    uv: num(a.uv) ?? 0,
    inv: num(a.inv) ?? 0,
    thin: a.thin === true,
    // Since version 2: the model's own relevance (1–100) against the list's strict prompt, the
    // checked requirements score, a hard reject, its one-line reason and the pay match.
    rel: num(a.rel) ?? null,
    fit: num(a.fit) ?? null,
    rej: a.rej === true,
    why: str(a.why, 240) || "",
    pay: a.pay && typeof a.pay === "object"
      ? { lo: num(a.pay.lo) ?? null, hi: num(a.pay.hi) ?? null, from: str(a.pay.from, 8) || null, ok: str(a.pay.ok, 8) || "unknown" }
      : { lo: null, hi: null, from: null, ok: "unknown" },
    v: num(a.v) ?? 1,
    t: num(a.t) ?? 0,
  };
}

// The rating's prompt and the model's raw answer. Every field is always there (see aiOf).
function dbgOf(d) {
  if (!d || typeof d !== "object" || typeof d.p !== "string") return undefined;
  return { p: d.p.slice(0, 12000), o: str(d.o, 4000) || "", m: str(d.m, 60) || "", pay: str(d.pay, 1500) || "", t: num(d.t) ?? 0 };
}

// An opening as lists show it: without its prompt and answer.
const listed = ({ dbg, ...o }) => o;

// The posting date if a source gave one, else when the radar first saw it.
function openedAtOf(o, now) {
  for (const v of [o.postedAt, o.seenSince]) {
    const t = typeof v === "number" ? v : Date.parse(v || "");
    if (t > 0 && t <= now) return t;
  }
  return now;
}

// Delete what opened before the window (and old run logs), a batch at a time.
async function prune(days, now) {
  const cut = now - days * DAY;
  let deleted = 0;
  for (const [name, field] of [
    [OPENINGS, "openedAt"],
    [RUNS, "receivedAt"],
  ]) {
    for (let round = 0; round < 20; round++) {
      const snap = await db().collection(name).where(field, "<", cut).limit(400).get();
      if (snap.empty) break;
      const batch = db().batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      if (name === OPENINGS) deleted += snap.size;
      if (snap.size < 400) break;
    }
  }
  // The finder's "today" openings go sooner. One equality filter, so no composite index needed.
  const finderCut = now - FINDER_KEEP_DAYS * DAY;
  const finders = await db().collection(OPENINGS).where("finder", "==", FINDER).get();
  const old = finders.docs.filter((d) => (d.get("openedAt") || 0) < finderCut);
  for (let i = 0; i < old.length; i += 400) {
    const batch = db().batch();
    old.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return deleted + old.length;
}

// ── The job finder's upload, from the snapshot ──────────────────────────────

/**
 * What one finder upload changes, worked out from the snapshot (no reads): each incoming opening
 * updates the stored one with its company:openingId, or is created; then what the DELETE would
 * remove goes (finder openings after FINDER_KEEP_DAYS, the rest after KEEP_DAYS), as far as the
 * transaction's room allows. `found` are stored openings this upload names that the snapshot
 * doesn't have (a stale snapshot must never make duplicates). → { writes, openings, counts }
 */
export function planFinderUpload({ current, found = [], incoming, remove = [], now, room = 440 }) {
  const byId = new Map(current.map((o) => [o.id, o]));
  for (const o of found) if (!byId.has(o.id)) byId.set(o.id, o); // stored, but missing from the snapshot: back in
  const idOfBase = new Map();
  for (const o of byId.values()) if (!idOfBase.has(o.base)) idOfBase.set(o.base, o.id);
  const keepCut = now - KEEP_DAYS * DAY;
  const finderCut = now - FINDER_KEEP_DAYS * DAY;
  const writes = [];
  let created = 0;
  let updated = 0;
  let tooOld = 0;
  let removed = 0;
  // Jobs the finder put here that its rules now turn down: only its own, never the radar's.
  for (const base of remove) {
    const id = idOfBase.get(base);
    const o = id && byId.get(id);
    if (!o || o.finder !== FINDER || incoming.has(base)) continue;
    writes.push({ op: "delete", id });
    byId.delete(id);
    idOfBase.delete(base);
    removed += 1;
  }
  for (const [base, { company, o }] of incoming) {
    const data = fields(o);
    const id = idOfBase.get(base);
    const old = id && byId.get(id);
    if (old) {
      const sources = [...new Set([...(old.sources || []), ...(Array.isArray(o.sources) ? o.sources : [o.source])].filter(Boolean))].slice(0, 6);
      writes.push({ op: "update", id, data: { ...data, sources, lastSeen: now } });
      byId.set(id, { ...old, ...data, sources, lastSeen: now, runs: (old.runs || 0) + 1 });
      updated += 1;
      continue;
    }
    const openedAt = openedAtOf(o, now);
    if (openedAt < keepCut) {
      tooOld += 1; // opened before the keep window: the DELETE would remove it anyway
      continue;
    }
    const newId = `${base}:${openedAt}`;
    const doc = {
      ...data,
      base,
      company,
      companySlug: slug(company),
      openingId: cleanId(o.openingId),
      sources: (Array.isArray(o.sources) ? o.sources : [o.source]).filter(Boolean).slice(0, 6),
      openedAt,
      firstSeen: now,
      lastSeen: now,
      runs: 1,
    };
    writes.push({ op: "create", id: newId, data: doc });
    byId.set(newId, { id: newId, ...doc });
    idOfBase.set(base, newId);
    created += 1;
  }
  const old = [...byId.values()]
    .filter((o) => (o.openedAt || 0) < keepCut || (o.finder === FINDER && (o.openedAt || 0) < finderCut))
    .sort((a, b) => (a.openedAt || 0) - (b.openedAt || 0))
    .slice(0, Math.max(0, room - writes.length));
  for (const o of old) {
    writes.push({ op: "delete", id: o.id });
    byId.delete(o.id);
  }
  return { writes, openings: [...byId.values()].sort(byNewest), counts: { created, updated, tooOld, removed, deleted: old.length } };
}

// An upload's `remove` list → company:openingId bases (as many as an upload may send).
const removeBasesOf = (list) => [
  ...new Set(
    (Array.isArray(list) ? list : [])
      .slice(0, MAX_OPENINGS)
      .map((r) => [slug(str(r?.company, 120)), cleanId(r?.openingId)])
      .filter(([c, id]) => c && id)
      .map(([c, id]) => `${c}:${id}`)
  ),
];

// One finder upload: the snapshot read, the openings written, the old ones pruned and the snapshot
// written back, in one transaction. Null when there's no usable snapshot (the full path runs then).
async function finderUpsert(incoming, remove, now) {
  const col = db().collection(OPENINGS);
  return db().runTransaction(async (tx) => {
    const main = await tx.get(partRef(0));
    if (!main.exists || !main.get("data")) return null;
    const n = main.get("parts") || 1;
    const rest = n > 1 ? await tx.getAll(...partRefs(n)) : [];
    const current = snapshotFrom([main.data(), ...rest.map((d) => (d.exists ? d.data() : null))]);
    if (!current) return null;
    const known = new Set(current.map((o) => o.base));
    const unknown = [...incoming.keys()].filter((b) => !known.has(b));
    const found = [];
    for (let i = 0; i < unknown.length; i += 30) {
      const q = await tx.get(col.where("base", "in", unknown.slice(i, i + 30)));
      found.push(...q.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
    const plan = planFinderUpload({ current, found, incoming, remove, now, room: 440 - MAX_PARTS });
    for (const w of plan.writes) {
      if (w.op === "create") tx.set(col.doc(w.id), w.data);
      else if (w.op === "update") tx.set(col.doc(w.id), { ...w.data, runs: FieldValue.increment(1) }, { merge: true });
      else tx.delete(col.doc(w.id));
    }
    setSnapshot(tx, plan.openings, (main.get("rev") || 0) + 1, now);
    return plan.counts;
  });
}

export async function DELETE(request) {
  if (!adminConfigured() || !process.env.RADAR_INGEST_TOKEN) return json({ error: "not-configured" }, 503);
  if (!tokenMatches(request, process.env.RADAR_INGEST_TOKEN)) return json({ error: "unauthorized" }, 401);
  const days = Number(new URL(request.url).searchParams.get("days")) || KEEP_DAYS;
  if (!(days >= 1)) return json({ error: "bad-days" }, 400);
  const now = Date.now();
  const deleted = await prune(days, now);
  await writeSnapshot(now);
  return json({ deleted, olderThanDays: days });
}

// ── Company pay: Firestore collection companyPay, one document per company ──────
const PAY = "companyPay";
const MAX_PAY_KEYS = 100;

// { pay: "get", keys } → { found }; { pay: "put", entries } → { saved, kept, rejected }
export async function payAction(body, now = Date.now(), store = db()) {
  const col = store.collection(PAY);
  if (body.pay === "get") {
    const keys = [...new Set((Array.isArray(body.keys) ? body.keys : []).map((k) => payKey(String(k))).filter(Boolean))].slice(0, MAX_PAY_KEYS);
    const found = {};
    if (keys.length) {
      for (const d of await store.getAll(...keys.map((k) => col.doc(k)))) {
        if (d.exists && payFresh(d.data(), now)) found[d.id] = d.data();
      }
    }
    return { found };
  }
  const entries = (Array.isArray(body.entries) ? body.entries : []).slice(0, 50);
  const rejected = [];
  const todo = [];
  for (const e of entries) {
    const company = str(e?.company, 120);
    const key = payKey(company);
    const c = confidentPay(e);
    if (!key || !c.ok) {
      rejected.push({ company: company || "", why: key ? c.why : "no company name" });
      continue;
    }
    todo.push({ key, rec: payRecord(e, company, now) });
  }
  let saved = 0;
  let kept = 0;
  if (todo.length) {
    // A figure saved in the last 30 days stays: nothing is overwritten by the next lookup's noise.
    const have = await store.getAll(...todo.map((t) => col.doc(t.key)));
    const batch = store.batch();
    todo.forEach((t, i) => {
      const old = have[i];
      if (old.exists && payFresh(old.data(), now) && now - (old.data().at || 0) < 30 * DAY) {
        kept += 1;
        return;
      }
      batch.set(col.doc(t.key), t.rec);
      saved += 1;
    });
    if (saved) await batch.commit();
  }
  return { saved, kept, rejected };
}

// ── POST: store a run ─────────────────────────────────────────────────────────
export async function POST(request) {
  const secret = process.env.RADAR_INGEST_TOKEN;
  if (!adminConfigured() || !secret) return json({ error: "not-configured" }, 503);
  if (!/^Bearer ./.test(request.headers.get("authorization") || "")) return json({ error: "unauthorized" }, 401);
  const ingest = tokenMatches(request, secret);
  const finderKey = !ingest && tokenMatches(request, finderToken(secret));
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return ingest || finderKey ? json({ error: "bad-json" }, 400) : json({ error: "unauthorized" }, 401);
  }
  const finder = body?.finder === FINDER ? FINDER : null;
  // The site's Job tracker page, signed in as the owner, asks for the finder's token to hand
  // to the extension (src/pages/JobTracker/finderBridge.js). Nothing else uses an ID token here.
  if (finder && body.pair === true && !ingest && !finderKey) {
    if (!isOwner(await verifiedUser(request))) return json({ error: "unauthorized" }, 401);
    return json({ ok: true, finder: true, token: finderToken(secret) });
  }
  // The finder's own token only ever sends finder openings.
  if (!ingest && !(finder && finderKey)) return json({ error: "unauthorized" }, 401);
  // The finder asks this before its first upload of the day: "do you know me?" Writes nothing.
  if (finder && body.check === true) return json({ ok: true, finder: true });
  // When you last started over: every browser's finder asks at the start of a run, and starts over too.
  if (finder && body.state === true) {
    const doc = await db().collection("appCache").doc("radar").get();
    return json({ ok: true, finder: true, resetAt: (doc.exists && doc.get("finderResetAt")) || 0 });
  }
  // "Start over": every opening the finder put here goes (both lists; never the radar's), and the
  // time is kept for the other browser's finder. Then the snapshot is rebuilt.
  if (finder && body.reset === true) {
    const now = Date.now();
    const mine = await db().collection(OPENINGS).where("finder", "==", FINDER).get();
    for (let i = 0; i < mine.docs.length; i += 400) {
      const batch = db().batch();
      mine.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await db().collection("appCache").doc("radar").set({ finderResetAt: now }, { merge: true });
    await writeSnapshot(now);
    return json({ ok: true, finder: true, deleted: mine.size, resetAt: now });
  }
  // The company pay database: read and write, by the finder's token or the radar's.
  if (body?.pay === "get" || body?.pay === "put") return json(await payAction(body));
  if (!Array.isArray(body?.openings)) return json({ error: "no-openings" }, 400);

  const now = Date.now();
  // One entry per company:openingId; the first copy in the list wins.
  const incoming = new Map();
  let rejected = 0;
  for (const o of body.openings.slice(0, MAX_OPENINGS)) {
    const company = str(o?.company, 120);
    const base = `${slug(company)}:${cleanId(o?.openingId)}`;
    if (!company || !cleanId(o?.openingId) || !o.title || !/^https?:\/\//.test(o.url || "")) {
      rejected += 1;
      continue;
    }
    if (!incoming.has(base)) incoming.set(base, { company, o });
  }

  // The job finder's upload: from the snapshot, in one transaction (see the top of this file).
  // Without a usable snapshot it takes the full path below, which writes one.
  if (finder) {
    let r = null;
    try {
      r = await finderUpsert(incoming, removeBasesOf(body.remove), now);
    } catch (e) {
      console.error("radar: finder upload from the snapshot failed; taking the full path", e);
    }
    if (r) {
      const summary = body.summary && typeof body.summary === "object" ? body.summary : {};
      const run = { ...summary, kind: "naukri-finder", receivedAt: now, received: body.openings.length, ...r, rejected };
      const scope = FINDER_SCOPES.has(summary.scope) ? summary.scope : "both";
      await Promise.all([
        db().collection(RUNS).doc(`${now}-finder`).set(run),
        db().collection("appCache").doc("radar").set({ latestFinderRun: run, finderRuns: { [scope]: run } }, { merge: true }),
      ]);
      return json({ ...r, rejected, finder: true });
    }
  }

  const col = db().collection(OPENINGS);
  const existing = await storedByBase(col, [...incoming.keys()]);

  const keepCut = now - KEEP_DAYS * DAY;
  let created = 0;
  let updated = 0;
  let tooOld = 0;
  let batch = db().batch();
  let ops = 0;
  const writes = [];
  for (const [base, { company, o }] of incoming) {
    const old = existing.get(base);
    const data = fields(o);
    if (!old && openedAtOf(o, now) < keepCut) {
      tooOld += 1; // opened before the keep window: the DELETE would remove it anyway
      continue;
    }
    if (old) {
      const sources = [...new Set([...(old.get("sources") || []), ...(Array.isArray(o.sources) ? o.sources : [o.source])].filter(Boolean))].slice(0, 6);
      // An opening the finder owns keeps the finder's verdict when the radar sees it too.
      const keepFinder = !finder && old.get("finder");
      batch.set(old.ref, keepFinder ? { sources, lastSeen: now, runs: FieldValue.increment(1) } : { ...data, sources, lastSeen: now, runs: FieldValue.increment(1) }, { merge: true });
      updated += 1;
    } else {
      const openedAt = openedAtOf(o, now);
      const id = `${base}:${openedAt}`;
      batch.set(col.doc(id), {
        ...data,
        base,
        company,
        companySlug: slug(company),
        openingId: cleanId(o.openingId),
        sources: (Array.isArray(o.sources) ? o.sources : [o.source]).filter(Boolean).slice(0, 6),
        openedAt,
        firstSeen: now,
        lastSeen: now,
        runs: 1,
      });
      created += 1;
    }
    if (++ops === 450) {
      writes.push(batch.commit());
      batch = db().batch();
      ops = 0;
    }
  }
  if (ops) writes.push(batch.commit());
  await Promise.all(writes);

  // Openings the run saw but its rules now reject: delete any stored copy
  // (never one this same upload just stored, and never one the finder owns).
  // (The radar removes only its own openings, the finder only the finder's.)
  const removeBases = removeBasesOf(body.remove).filter((b) => !incoming.has(b));
  const stale = [...(await storedByBase(col, removeBases)).values()].filter((d) => (finder ? d.get("finder") === FINDER : !d.get("finder")));
  for (let i = 0; i < stale.length; i += 450) {
    const del = db().batch();
    stale.slice(i, i + 450).forEach((d) => del.delete(d.ref));
    await del.commit();
  }
  const removed = stale.length;

  // The DELETE, run in-process after every upload to keep the collection thin.
  const deleted = await prune(KEEP_DAYS, now);

  const summary = body.summary && typeof body.summary === "object" ? body.summary : {};
  const run = { ...summary, ...(finder ? { kind: "naukri-finder" } : {}), receivedAt: now, received: body.openings.length, created, updated, tooOld, rejected, removed, deleted };
  // Two browsers may each search for one list: keep each one's latest run too.
  const scope = FINDER_SCOPES.has(summary.scope) ? summary.scope : "both";
  await Promise.all([
    db().collection(RUNS).doc(`${now}${finder ? "-finder" : ""}`).set(run),
    // The radar's run and the finder's run are kept side by side.
    db().collection("appCache").doc("radar").set(finder ? { latestFinderRun: run, finderRuns: { [scope]: run } } : { latestRun: run }, { merge: true }),
    writeSnapshot(now),
  ]);
  return json({ created, updated, tooOld, rejected, removed, deleted, ...(finder ? { finder: true } : {}) });
}

// Stored openings by their company:openingId (Firestore's "in" takes 30 values at a time).
async function storedByBase(col, bases) {
  const found = new Map();
  const chunks = [];
  for (let i = 0; i < bases.length; i += 30) chunks.push(bases.slice(i, i + 30));
  for (const snap of await Promise.all(chunks.map((c) => col.where("base", "in", c).get()))) {
    for (const d of snap.docs) if (!found.has(d.get("base"))) found.set(d.get("base"), d);
  }
  return found;
}

// ── GET: read openings, newest first ──────────────────────────────────────────
async function canRead(request) {
  if (tokenMatches(request, process.env.RADAR_READ_TOKEN)) return true;
  const user = await verifiedUser(request);
  return !!user && (user.email || "").toLowerCase() === OWNER_EMAIL && user.email_verified === true;
}

export async function GET(request) {
  if (!adminConfigured()) return json({ error: "not-configured" }, 503);
  if (!(await canRead(request))) return json({ error: "not-found" }, 404);

  const params = new URL(request.url).searchParams;
  const activeCut = Date.now() - ACTIVE_DAYS * DAY;

  // One opening's rating prompt and the model's answer.
  const debugId = params.get("debug");
  if (debugId) {
    if (debugId.length > 400 || debugId.includes("/")) return json({ error: "bad-id" }, 400);
    const d = await db().collection(OPENINGS).doc(debugId).get();
    if (!d.exists) return json({ error: "not-found" }, 404);
    return json({ id: d.id, dbg: d.get("dbg") || null, ai: d.get("ai") || null });
  }

  if (params.get("all") === "1") {
    const [all, latest] = await Promise.all([readSnapshot(), db().collection("appCache").doc("radar").get()]);
    if (all) {
      return compressed(request, {
        openings: all.map((o) => ({ ...o, active: o.lastSeen >= activeCut })),
        nextCursor: null,
        total: all.length,
        summary: latest.exists ? latest.get("latestRun") : null,
        finderSummary: (latest.exists && latest.get("latestFinderRun")) || null,
        finderRuns: (latest.exists && latest.get("finderRuns")) || null,
      });
    }
  }

  const limit = Math.min(200, Math.max(1, Number(params.get("limit")) || 50));
  const cursor = params.get("cursor");
  const sinceRaw = params.get("since");
  const since = sinceRaw ? (/^\d+$/.test(sinceRaw) ? Number(sinceRaw) : Date.parse(sinceRaw)) : null;
  if (sinceRaw && !(since >= 0)) return json({ error: "bad-since" }, 400);

  // Ties on openedAt are broken by document id, so pages never skip or repeat.
  let q = db().collection(OPENINGS).orderBy("openedAt", "desc").orderBy(FieldPath.documentId(), "desc");
  if (since != null) q = q.where("openedAt", ">=", since);
  if (cursor) {
    const at = cursor.lastIndexOf(":");
    const openedAt = Number(cursor.slice(at + 1));
    if (at < 0 || !(openedAt >= 0)) return json({ error: "bad-cursor" }, 400);
    q = q.startAfter(openedAt, cursor);
  }

  const [snap, total, latest] = await Promise.all([
    q.limit(limit).get(),
    cursor ? null : (since != null ? db().collection(OPENINGS).where("openedAt", ">=", since) : db().collection(OPENINGS)).count().get(),
    db().collection("appCache").doc("radar").get(),
  ]);
  const openings = snap.docs.map((d) => {
    const o = listed(d.data());
    return { id: d.id, ...o, active: o.lastSeen >= activeCut };
  });
  return json({
    openings,
    nextCursor: snap.size === limit ? snap.docs[snap.size - 1].id : null,
    ...(total ? { total: total.data().count } : {}),
    summary: latest.exists ? latest.get("latestRun") : null,
    finderSummary: (latest.exists && latest.get("latestFinderRun")) || null,
    finderRuns: (latest.exists && latest.get("finderRuns")) || null,
  });
}
