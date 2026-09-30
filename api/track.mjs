import { adminConfigured, auth, db } from "./_lib/admin.mjs";
import { OWNER_EMAIL, VISITS, cleanEvent, clientIp, deviceOf, geoOf, ipHash, isBot, istDay } from "./_lib/visits.mjs";

// POST /api/track — one page view or sign-in, sent by src/Data/visitTracker.js.
// Always answers 204: a visitor's page never waits on, or learns anything
// from, the stats. See _lib/visits.mjs for what is kept (and what isn't).
//
// Dropped: bots, anything malformed or oversized, bursts from one source, and
// the owner's own visits (signed in as the owner; the owner's devices also
// stop sending altogether once they've signed in there).

const MAX_BODY = 2048;
const BURST = { windowMs: 10 * 60 * 1000, max: 120 };
const recent = new Map(); // ip hash → { start, count } — per instance, a best-effort cap

function tooMany(key, now) {
  if (!key) return false;
  const r = recent.get(key);
  if (!r || now - r.start > BURST.windowMs) {
    recent.set(key, { start: now, count: 1 });
    if (recent.size > 5000) recent.clear();
    return false;
  }
  return ++r.count > BURST.max;
}

const done = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function POST(request) {
  try {
    if (!adminConfigured()) return done();
    const ua = request.headers.get("user-agent") || "";
    if (isBot(ua)) return done();
    const raw = await request.text();
    if (raw.length > MAX_BODY) return done();
    let body;
    try {
      body = JSON.parse(raw);
    } catch (_) {
      return done();
    }
    const event = cleanEvent(body);
    if (!event) return done();

    const now = Date.now();
    const day = istDay(now);
    const hash = ipHash(clientIp(request.headers), day, process.env.ANALYTICS_SALT || process.env.CRON_SECRET);
    if (tooMany(hash, now)) return done();

    // Who, if signed in: only from a verified ID token, never from the body.
    let who = {};
    const token = /^Bearer (.+)$/.exec(request.headers.get("authorization") || "")?.[1];
    if (token) {
      try {
        const claims = await auth().verifyIdToken(token);
        if ((claims.email || "").toLowerCase() === OWNER_EMAIL) return done();
        who = { uid: claims.uid, email: claims.email || "", name: claims.name || "" };
      } catch (_) {
        // An expired token still counts the visit, just as a guest.
      }
    }

    await db()
      .collection(VISITS)
      .add({ at: now, day, ...event, ...geoOf(request.headers), ...deviceOf(ua), ipHash: hash, ...who });
  } catch (err) {
    console.error("track:", err?.message || err);
  }
  return done();
}
