import { timingSafeEqual } from "crypto";
import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { adminConfigured, db, verifiedUser } from "./_lib/admin.mjs";
import { OWNER_EMAIL } from "./_lib/visits.mjs";

// The job radar's openings — Firestore is their permanent record.
// (The radar itself, scripts/radar/run.mjs, runs on the owner's PC — never in
// GitHub Actions.)
//
//   POST  Authorization: Bearer <RADAR_INGEST_TOKEN>
//         body { summary, openings: [{ company, openingId, title, url, postedAt, seenSince, … }] }
//         Every opening a run found. New ones are created, known ones updated
//         (lastSeen, pay, score…). Then it runs the DELETE below, so the
//         collection only ever holds the last KEEP_DAYS days.
//
//   DELETE Authorization: Bearer <RADAR_INGEST_TOKEN>
//         Deletes openings that opened more than KEEP_DAYS days ago, and run
//         logs as old. ?days=N for another age (at least 1).
//
//   GET   Authorization: Bearer <RADAR_READ_TOKEN>, or the owner's Firebase ID token
//         ?limit=50 (1–200)  ?cursor=<nextCursor from the previous page>
//         ?since=2026-10-01 (opened on or after; a date or epoch ms)
//         → { openings, nextCursor, total (first page only), summary (latest run) }
//         Newest opening first.
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
const ACTIVE_DAYS = 7; // seen by a run in the last week → still open
const MAX_OPENINGS = 2000;
const DAY = 86400000;

const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function tokenMatches(request, secret) {
  const m = /^Bearer (.+)$/.exec(request.headers.get("authorization") || "");
  if (!secret || !m) return false;
  const a = Buffer.from(m[1]);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

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
    exp: str(o.exp, 12),
    pay: o.pay && typeof o.pay === "object" ? { verdict: str(o.pay.verdict, 12) || "unknown", text: str(o.pay.text, 160) || "" } : undefined,
    matchScore: num(o.matchScore),
    matched: Array.isArray(o.matched)
      ? o.matched.slice(0, 10).map((m) => ({ skill: str(m?.skill, 40) || "", type: str(m?.type, 8) || "have" })).filter((m) => m.skill)
      : undefined,
    missing: Array.isArray(o.missing) ? o.missing.slice(0, 6).map((s) => str(s, 40)).filter(Boolean) : undefined,
    snippet: str(o.snippet, 260) || undefined,
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
  return deleted;
}

export async function DELETE(request) {
  if (!adminConfigured() || !process.env.RADAR_INGEST_TOKEN) return json({ error: "not-configured" }, 503);
  if (!tokenMatches(request, process.env.RADAR_INGEST_TOKEN)) return json({ error: "unauthorized" }, 401);
  const days = Number(new URL(request.url).searchParams.get("days")) || KEEP_DAYS;
  if (!(days >= 1)) return json({ error: "bad-days" }, 400);
  return json({ deleted: await prune(days, Date.now()), olderThanDays: days });
}

// ── POST: store a run ─────────────────────────────────────────────────────────
export async function POST(request) {
  if (!adminConfigured() || !process.env.RADAR_INGEST_TOKEN) return json({ error: "not-configured" }, 503);
  if (!tokenMatches(request, process.env.RADAR_INGEST_TOKEN)) return json({ error: "unauthorized" }, 401);
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: "bad-json" }, 400);
  }
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

  // Which of them are already stored (Firestore's "in" takes 30 values at a time).
  const bases = [...incoming.keys()];
  const existing = new Map();
  const col = db().collection(OPENINGS);
  const chunks = [];
  for (let i = 0; i < bases.length; i += 30) chunks.push(bases.slice(i, i + 30));
  for (const snap of await Promise.all(chunks.map((c) => col.where("base", "in", c).get()))) {
    for (const d of snap.docs) if (!existing.has(d.get("base"))) existing.set(d.get("base"), d);
  }

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
      batch.set(old.ref, { ...data, sources, lastSeen: now, runs: FieldValue.increment(1) }, { merge: true });
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

  // The DELETE, run in-process after every upload to keep the collection thin.
  const deleted = await prune(KEEP_DAYS, now);

  const summary = body.summary && typeof body.summary === "object" ? body.summary : {};
  const run = { ...summary, receivedAt: now, received: body.openings.length, created, updated, tooOld, rejected, deleted };
  await Promise.all([db().collection(RUNS).doc(String(now)).set(run), db().collection("appCache").doc("radar").set({ latestRun: run })]);
  return json({ created, updated, tooOld, rejected, deleted });
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
  const activeCut = Date.now() - ACTIVE_DAYS * DAY;
  const openings = snap.docs.map((d) => {
    const o = d.data();
    return { id: d.id, ...o, active: o.lastSeen >= activeCut };
  });
  return json({
    openings,
    nextCursor: snap.size === limit ? snap.docs[snap.size - 1].id : null,
    ...(total ? { total: total.data().count } : {}),
    summary: latest.exists ? latest.get("latestRun") : null,
  });
}
