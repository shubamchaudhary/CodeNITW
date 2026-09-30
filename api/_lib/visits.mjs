import { createHmac } from "node:crypto";

// First-party visit statistics: what one visit record holds, how a request
// becomes one, and how a range of them adds up for the dashboard and the
// nightly email. Pure functions only — no Firestore or mail here, so all of
// it can be checked without either.
//
// Privacy by design: no raw IP address is stored. Location is the city-level
// estimate Vercel attaches to every request; the IP only feeds a keyed hash
// that changes every day (enough to tell visitors apart within a day, useless
// for following anyone across days). Names and emails appear only for people
// signed in to this site, taken from their verified ID token.

export const VISITS = "visits";
export const OWNER_EMAIL = (process.env.OWNER_EMAIL || "beshubam@gmail.com").toLowerCase();

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http|java\/|vercel|facebookexternalhit|embedly|whatsapp|telegram|discord|slack/i;
export const isBot = (ua) => !ua || BOT.test(ua);

// "Windows · Chrome", mobile or not — enough to answer "what do people use".
export function deviceOf(ua = "") {
  const os = /Android/i.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/i.test(ua)
    ? "iOS"
    : /Mac OS X/i.test(ua)
    ? "macOS"
    : /Windows/i.test(ua)
    ? "Windows"
    : /CrOS/i.test(ua)
    ? "ChromeOS"
    : /Linux/i.test(ua)
    ? "Linux"
    : "Other";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
    ? "Opera"
    : /SamsungBrowser/.test(ua)
    ? "Samsung"
    : /Chrome\//.test(ua)
    ? "Chrome"
    : /Firefox\//.test(ua)
    ? "Firefox"
    : /Safari\//.test(ua)
    ? "Safari"
    : "Other";
  return { os, browser, mobile: /Mobi|Android|iPhone|iPod/i.test(ua) };
}

// Vercel's IP geolocation headers (absent locally).
export function geoOf(headers) {
  const get = (k) => headers.get(k) || "";
  const dec = (v) => {
    try {
      return decodeURIComponent(v);
    } catch (_) {
      return v;
    }
  };
  return {
    country: get("x-vercel-ip-country").slice(0, 2).toUpperCase(),
    region: dec(get("x-vercel-ip-country-region")).slice(0, 40),
    city: dec(get("x-vercel-ip-city")).slice(0, 60),
  };
}

export function clientIp(headers) {
  return (headers.get("x-forwarded-for") || "").split(",")[0].trim() || headers.get("x-real-ip") || "";
}

// A pseudonym for the IP that is different every day.
export function ipHash(ip, day, secret) {
  if (!ip) return null;
  return createHmac("sha256", secret || "interviewplanprep").update(`visits:${day}:${ip}`).digest("base64url").slice(0, 12);
}

// "2026-09-30" for a moment, in India time (the site's reporting day). IST is
// a fixed UTC+5:30 with no daylight saving, so plain arithmetic is exact —
// and doesn't depend on which locale data the runtime ships.
const IST_OFFSET_MS = 5.5 * 3600 * 1000;
export const istDay = (ms) => new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);

// Midnight (IST) at the start of the IST day `key` ("YYYY-MM-DD"), in ms.
export function istDayStart(key) {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d) - IST_OFFSET_MS;
}

const ID = /^[a-z0-9]{8,32}$/;
const clip = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");

// Only the referrer's site and page — never its query string, which can
// carry tokens or search terms.
function referrerOf(v) {
  try {
    const u = new URL(v);
    if (!/^https?:$/.test(u.protocol)) return "";
    return (u.host + u.pathname).slice(0, 200);
  } catch (_) {
    return "";
  }
}

// What the browser sent, checked and trimmed; null if it isn't a visit.
export function cleanEvent(body) {
  if (!body || typeof body !== "object") return null;
  const type = ["view", "signin", "signup"].includes(body.type) ? body.type : null;
  const path = clip(body.path, 200);
  if (!type || !path.startsWith("/")) return null;
  if (!ID.test(body.visitorId || "") || !ID.test(body.sessionId || "")) return null;
  return {
    type,
    path,
    referrer: referrerOf(body.referrer),
    visitorId: body.visitorId,
    sessionId: body.sessionId,
    newVisitor: body.newVisitor === true,
    screen: /^\d{2,5}x\d{2,5}$/.test(body.screen || "") ? body.screen : "",
    lang: clip(body.lang, 16),
    timeZone: clip(body.timeZone, 40),
  };
}

export const placeOf = (v) => [v.city, v.region, v.country].filter(Boolean).join(", ") || "Unknown";

// The n biggest rows of a { label → { views, visitors: Set } } tally, by
// `by` ("visitors" or "views") and then the other.
function ranked(map, n, key, by = "visitors") {
  const other = by === "views" ? "visitors" : "views";
  return [...map]
    .map(([label, v]) => ({ [key]: label, views: v.views, visitors: v.visitors.size }))
    .sort((a, b) => b[by] - a[by] || b[other] - a[other])
    .slice(0, n);
}

// Everything the dashboard and the report show, from the visits in
// [from, to). `events` may be in any order.
export function aggregate(events, { from, to }) {
  const visitorOf = (e) => e.visitorId || e.ipHash || "unknown";
  const days = [];
  for (let t = from; t < to; t += 24 * 3600 * 1000) days.push(istDay(t));
  const daily = new Map([...new Set(days)].map((d) => [d, { views: 0, visitors: new Set(), signedIn: new Set() }]));

  const visitors = new Set();
  const sessions = new Set();
  const newVisitors = new Set();
  const signedIn = new Set();
  let views = 0;
  let signIns = 0;
  let signUps = 0;
  const pages = new Map();
  const places = new Map();
  const browsers = new Map();
  const systems = new Map();
  const referrers = new Map();
  const users = new Map();
  let mobile = 0;
  let desktop = 0;
  const seenDevice = new Set();

  const bump = (map, label, e) => {
    const row = map.get(label) || { views: 0, visitors: new Set() };
    if (e.type === "view") row.views++;
    row.visitors.add(visitorOf(e));
    map.set(label, row);
  };

  for (const e of events) {
    if (!(e.at >= from && e.at < to)) continue;
    const v = visitorOf(e);
    visitors.add(v);
    sessions.add(e.sessionId);
    if (e.newVisitor) newVisitors.add(v);
    const day = daily.get(e.day || istDay(e.at));
    if (day) {
      if (e.type === "view") day.views++;
      day.visitors.add(v);
      if (e.uid) day.signedIn.add(e.uid);
    }
    if (e.type === "signin") signIns++;
    if (e.type === "signup") signUps++;
    if (e.type === "view") {
      views++;
      bump(pages, e.path, e);
    }
    bump(places, placeOf(e), e);
    bump(browsers, e.browser || "Other", e);
    bump(systems, e.os || "Other", e);
    if (e.referrer && !/interviewplanprep\.vercel\.app/.test(e.referrer)) bump(referrers, e.referrer.split("/")[0], e);
    if (!seenDevice.has(v)) {
      seenDevice.add(v);
      if (e.mobile) mobile++;
      else desktop++;
    }
    if (e.uid) {
      signedIn.add(e.uid);
      const u = users.get(e.uid) || { uid: e.uid, name: "", email: "", views: 0, signIns: 0, signedUp: false, firstSeen: e.at, lastSeen: 0, place: "" };
      u.name = u.name || e.name || "";
      u.email = u.email || e.email || "";
      if (e.type === "view") u.views++;
      else u.signIns++;
      if (e.type === "signup") u.signedUp = true;
      u.firstSeen = Math.min(u.firstSeen, e.at);
      if (e.at >= u.lastSeen) {
        u.lastSeen = e.at;
        u.place = placeOf(e);
      }
      users.set(e.uid, u);
    }
  }

  return {
    range: { from, to, days: daily.size },
    totals: {
      visitors: visitors.size,
      views,
      sessions: sessions.size,
      newVisitors: newVisitors.size,
      signedInVisitors: signedIn.size,
      signIns,
      signUps,
    },
    daily: [...daily].map(([day, d]) => ({ day, views: d.views, visitors: d.visitors.size, signedIn: d.signedIn.size })),
    pages: ranked(pages, 10, "path", "views"),
    places: ranked(places, 10, "place"),
    browsers: ranked(browsers, 6, "name"),
    systems: ranked(systems, 6, "name"),
    referrers: ranked(referrers, 8, "host"),
    devices: { mobile, desktop },
    users: [...users.values()].sort((a, b) => b.lastSeen - a.lastSeen),
    recent: [...events]
      .filter((e) => e.at >= from && e.at < to)
      .sort((a, b) => b.at - a.at)
      .slice(0, 60)
      .map((e) => ({
        at: e.at,
        type: e.type,
        path: e.path,
        place: placeOf(e),
        device: `${e.os || "Other"} · ${e.browser || "Other"}${e.mobile ? " · mobile" : ""}`,
        user: e.uid ? e.name || e.email || "Signed in" : null,
        email: e.email || null,
        visitor: visitorOf(e).slice(0, 6),
      })),
  };
}
