import { adminConfigured, db, verifiedUser } from "./_lib/admin.mjs";
import { OWNER_EMAIL, VISITS, aggregate, istDay, istDayStart } from "./_lib/visits.mjs";

// GET /api/visitors?days=1|7|30|90 — visit stats for the owner's dashboard,
// over whole India-time days, today included. Anyone else gets a 404, the
// same as an address that doesn't exist.

const DAY = 24 * 3600 * 1000;
const RANGES = new Set([1, 7, 30, 90]);
const MAX_EVENTS = 20000;

const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request) {
  if (!adminConfigured()) return json({ error: "not-configured" }, 503);
  const user = await verifiedUser(request);
  if (!user || (user.email || "").toLowerCase() !== OWNER_EMAIL || user.email_verified !== true) {
    return json({ error: "not-found" }, 404);
  }
  const asked = Number(new URL(request.url).searchParams.get("days"));
  const days = RANGES.has(asked) ? asked : 7;
  const today = istDayStart(istDay(Date.now()));
  const from = today - (days - 1) * DAY;
  const to = today + DAY;

  const snap = await db().collection(VISITS).where("at", ">=", from).orderBy("at", "desc").limit(MAX_EVENTS).get();
  return json({ ...aggregate(snap.docs.map((d) => d.data()), { from, to }), truncated: snap.size === MAX_EVENTS });
}
