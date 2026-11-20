import { createHmac, timingSafeEqual } from "crypto";
import { gunzipSync, gzipSync } from "zlib";
import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { adminConfigured, db, verifiedUser } from "./_lib/admin.mjs";
import { OWNER_EMAIL } from "./_lib/visits.mjs";

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
//         body { finder: "naukri", summary, openings } is the Naukri job finder
//         (extensions/naukri-refresher): same openings plus rank/profile/coverage,
//         never removes anything, its run kept as latestFinderRun (and per list it
//         searched for, finderRuns.backend|ai|both), its openings kept
//         FINDER_KEEP_DAYS. { finder: "naukri", check: true } only answers
//         { ok, finder: true } (the finder asks before uploading; writes nothing).
//         The finder may use its own token instead of RADAR_INGEST_TOKEN: it can
//         only send finder openings. { finder: "naukri", pair: true } with the
//         owner's Firebase ID token answers { ok, finder: true, token } — the site's
//         Job tracker page hands that token to the extension, so nothing is pasted.
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
// The data only changes when the radar uploads (five times a day), so each
// POST and DELETE writes a snapshot of every opening, newest first, gzipped
// into one document (appCache/radarOpenings).
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

// ── Snapshot: every opening in one document ──────────────────────────────────
const snapshotDoc = () => db().collection("appCache").doc("radarOpenings");
const SNAPSHOT_MAX = 900 * 1024; // a Firestore document holds at most 1 MiB

async function writeSnapshot(now) {
  const snap = await db().collection(OPENINGS).orderBy("openedAt", "desc").orderBy(FieldPath.documentId(), "desc").get();
  const openings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const data = gzipSync(Buffer.from(JSON.stringify(openings))).toString("base64");
  // Far more openings than the radar keeps; readers then page instead.
  await snapshotDoc().set(data.length > SNAPSHOT_MAX ? { tooBig: true, at: now } : { data, count: openings.length, at: now });
}

async function readSnapshot() {
  const doc = await snapshotDoc().get();
  if (!doc.exists || !doc.get("data")) return null;
  return JSON.parse(gunzipSync(Buffer.from(doc.get("data"), "base64")).toString("utf8"));
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
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined));
}

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
  const removeBases = [
    ...new Set(
      (Array.isArray(body.remove) && !finder ? body.remove : [])
        .slice(0, MAX_OPENINGS)
        .map((r) => [slug(str(r?.company, 120)), cleanId(r?.openingId)])
        .filter(([c, id]) => c && id)
        .map(([c, id]) => `${c}:${id}`)
        .filter((b) => !incoming.has(b))
    ),
  ];
  const stale = [...(await storedByBase(col, removeBases)).values()].filter((d) => !d.get("finder"));
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

  if (params.get("all") === "1") {
    const [all, latest] = await Promise.all([readSnapshot(), db().collection("appCache").doc("radar").get()]);
    if (all) {
      return json({
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
    const o = d.data();
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
