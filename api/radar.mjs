import { adminConfigured, db, verifiedUser } from "./_lib/admin.mjs";
import { OWNER_EMAIL } from "./_lib/visits.mjs";

// The job radar's openings (scripts/radar/run.mjs, which runs on the owner's
// own PC — never in GitHub Actions).
//
//   POST, "Authorization: Bearer <CRON_SECRET>" — the radar uploads its latest
//        list; it replaces the previous one.
//   GET,  the owner's Firebase ID token — the Jobs page's Openings tab reads it.
//        Anyone else gets a 404, the same as an address that doesn't exist.
//
// One Firestore document (appCache/radar) holds the list as a JSON string, so
// its hundreds of fields aren't indexed and it stays under the 1 MiB limit.

const MAX_BYTES = 900 * 1024;
const MAX_OPENINGS = 600;

const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const doc = () => db().collection("appCache").doc("radar");

const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : undefined);
const num = (v) => (typeof v === "number" && isFinite(v) ? v : undefined);

// Keep only the fields the page shows, each a sane size.
function clean(o) {
  if (!o || typeof o !== "object" || !/^https?:\/\//.test(o.url || "") || !o.title) return null;
  return {
    key: str(o.key, 40),
    source: str(o.source, 20),
    sources: Array.isArray(o.sources) ? o.sources.slice(0, 6).map((s) => str(s, 20)) : undefined,
    company: str(o.company, 120),
    title: str(o.title, 200),
    location: str(o.location, 160),
    url: str(o.url, 600),
    postedAt: str(o.postedAt, 10),
    firstSeen: str(o.firstSeen, 30),
    minYoe: num(o.minYoe),
    exp: str(o.exp, 12),
    pay: o.pay && typeof o.pay === "object" ? { verdict: str(o.pay.verdict, 12), text: str(o.pay.text, 120) } : undefined,
    matchScore: num(o.matchScore),
    matched: Array.isArray(o.matched)
      ? o.matched.slice(0, 10).map((m) => ({ skill: str(m?.skill, 40), type: str(m?.type, 8) })).filter((m) => m.skill)
      : undefined,
    missing: Array.isArray(o.missing) ? o.missing.slice(0, 6).map((s) => str(s, 40)).filter(Boolean) : undefined,
    snippet: str(o.snippet, 260),
  };
}

export async function POST(request) {
  if (!adminConfigured()) return json({ error: "not-configured" }, 503);
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return json({ error: "unauthorized" }, 401);
  }
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: "bad-json" }, 400);
  }
  if (!Array.isArray(body?.openings)) return json({ error: "no-openings" }, 400);

  let openings = body.openings.slice(0, MAX_OPENINGS).map(clean).filter(Boolean);
  const summary = body.summary && typeof body.summary === "object" ? body.summary : {};
  let data = JSON.stringify({ summary, openings });
  // The list arrives newest first, so the oldest go if it's ever too big for one document.
  while (Buffer.byteLength(data) > MAX_BYTES && openings.length) {
    openings = openings.slice(0, Math.floor(openings.length * 0.9));
    data = JSON.stringify({ summary, openings });
  }
  await doc().set({ data, updatedAt: Date.now(), count: openings.length });
  return json({ saved: openings.length });
}

export async function GET(request) {
  if (!adminConfigured()) return json({ error: "not-configured" }, 503);
  const user = await verifiedUser(request);
  if (!user || (user.email || "").toLowerCase() !== OWNER_EMAIL || user.email_verified !== true) {
    return json({ error: "not-found" }, 404);
  }
  const snap = await doc().get();
  if (!snap.exists) return json({ summary: null, openings: [] });
  return json(JSON.parse(snap.get("data")));
}
