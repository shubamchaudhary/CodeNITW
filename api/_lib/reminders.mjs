import { createHmac, timingSafeEqual } from "node:crypto";
import { PLATFORMS } from "./contests.mjs";

// The pieces of the reminder emails that don't touch the network: which
// reminders are due, signed links, and the emails themselves. Kept pure so
// they can be checked without Firebase or a mailbox.

export const SITE_URL = (process.env.SITE_URL || "https://interviewplanprep.vercel.app").replace(/\/$/, "");
export const DEFAULT_TZ = "Asia/Kolkata";

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

// The job runs every ~10 minutes, and a scheduled run can start late, so each
// reminder has a window rather than an instant:
//   day  — once the contest is within 24h (+5 min), unless it's under 3h away
//          by then (the hour reminder covers that);
//   hour — once it's within 65 min, until 2 min before it starts.
export const WINDOWS = {
  day: { from: 24 * HOUR + 5 * MIN, until: 3 * HOUR },
  hour: { from: 65 * MIN, until: 2 * MIN },
};

export function dueReminders(contests, now) {
  const due = [];
  for (const contest of contests) {
    const left = contest.start - now;
    for (const [kind, w] of Object.entries(WINDOWS)) {
      if (left <= w.from && left > w.until) {
        // Keyed by start time too: a contest that gets rescheduled is
        // reminded about again at its new time.
        due.push({ contest, kind, key: `${contest.id}@${contest.start}:${kind}`.replace(/\//g, "_") });
      }
    }
  }
  return due;
}

// ── Signed links (confirm / unsubscribe) ────────────────────────────────────
// An HMAC of the action and the account, so a link works without signing in
// and can't be forged for someone else's account.
function sign(action, uid, secret) {
  return createHmac("sha256", secret).update(`contest-alerts:${action}:${uid}`).digest("base64url");
}

export function checkLinkToken(action, uid, token, secret) {
  if (!secret || !uid || !token) return false;
  const a = Buffer.from(sign(action, uid, secret));
  const b = Buffer.from(String(token));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function linkUrl(action, uid, secret) {
  const q = new URLSearchParams({ a: action, u: uid, t: sign(action, uid, secret) });
  return `${SITE_URL}/api/email-link?${q}`;
}

// ── Formatting ──────────────────────────────────────────────────────────────
export function validTimeZone(tz) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(0);
    return tz;
  } catch (_) {
    return DEFAULT_TZ;
  }
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function duration(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
}

// "Today" / "Tomorrow" / "Sunday", in the reader's own time zone.
function dayWord(start, now, tz) {
  const day = (t) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(t);
  const today = day(now);
  if (day(start) === today) return "Today";
  if (day(start) === day(now + 24 * HOUR) && day(start) !== today) return "Tomorrow";
  return new Intl.DateTimeFormat("en-IN", { weekday: "long", timeZone: tz }).format(start);
}

function timeOf(start, tz) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
    timeZoneName: "short",
  })
    .format(start)
    .replace(/\b(am|pm)\b/, (x) => x.toUpperCase());
}

function dateOf(start, tz) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: tz }).format(start);
}

// "in an hour", or the real minutes when a run started late.
function startsIn(ms) {
  const min = Math.max(1, Math.round(ms / MIN));
  return min >= 45 ? "in an hour" : `in ${min} minutes`;
}

// "today at 2:42 PM IST" / "tomorrow at …" / "on Sunday at …".
function relativeWhen(start, now, tz) {
  const day = dayWord(start, now, tz);
  const lead = day === "Today" || day === "Tomorrow" ? day.toLowerCase() : `on ${day}`;
  return `${lead} at ${timeOf(start, tz)}`;
}

const PLATFORM_COLOR = { leetcode: "#c77700", codeforces: "#1a6fa3", codechef: "#6b4428" };
const PLATFORM_TINT = { leetcode: "#fff4e0", codeforces: "#e6f2fa", codechef: "#f4ece5" };
const logoUrl = (platform) => `${SITE_URL}/email/${platform}.png`;

// Google Calendar's "add event" link — offered for contests a day out.
function calendarUrl(c) {
  const stamp = (t) => new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: `${c.name} (${PLATFORMS[c.platform].label})`,
    dates: `${stamp(c.start)}/${stamp(c.start + c.durationMin * MIN)}`,
    details: c.url,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const LINK = "color:#6d28d9;font-weight:600;text-decoration:none";

// A plain email: white, left-aligned, no banners. Deliberately close to what
// a person would write, so it reads (and filters) as a note, not a campaign.
function page(inner) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff">
<div style="max-width:560px;padding:8px 4px;font-family:${FONT};font-size:14px;line-height:1.6;color:#1f2937">${inner}</div>
</body></html>`;
}

const signOff = `<p style="margin:20px 0 0">Good luck,<br><a href="${SITE_URL}" style="${LINK}">InterviewPlanPrep</a></p>`;

function logoTile(platform) {
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="44" height="44" align="center" valign="middle" style="width:44px;height:44px;border-radius:12px;background:${PLATFORM_TINT[platform]}">
    <img src="${logoUrl(platform)}" width="28" height="28" alt="${esc(PLATFORMS[platform].label)}" style="display:block;border:0">
  </td></tr></table>`;
}

const chip = (text, strong = false) =>
  `<span style="display:inline-block;margin:0 6px 6px 0;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;${
    strong ? "background:#ede9fe;color:#5b21b6" : "background:#f3f4f6;color:#374151"
  }">${esc(text)}</span>`;

// One contest: logo, platform, name, then when and how long as small tags.
function contestBlock(i, now, tz) {
  const c = i.contest;
  const p = PLATFORMS[c.platform];
  const soon = i.kind === "hour" ? `Starts ${startsIn(c.start - now)}` : dayWord(c.start, now, tz);
  const links = [`<a href="${esc(c.url)}" style="${LINK}">Open on ${esc(p.label)} &rarr;</a>`];
  if (i.kind === "day") links.push(`<a href="${esc(calendarUrl(c))}" style="${LINK}">Add to calendar</a>`);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px"><tr>
    <td width="44" valign="top" style="padding-top:2px">${logoTile(c.platform)}</td>
    <td valign="top" style="padding-left:12px">
      <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${PLATFORM_COLOR[c.platform]}">${esc(p.label)}</div>
      <div style="margin:1px 0 8px;font-size:16px;line-height:1.35;font-weight:700;color:#111827">${esc(c.name)}</div>
      <div>${chip(soon, true)}${chip(dateOf(c.start, tz))}${chip(timeOf(c.start, tz))}${chip(duration(c.durationMin))}</div>
      <div style="margin-top:2px;font-size:13px">${links.join(' <span style="color:#d1d5db">&nbsp;·&nbsp;</span> ')}</div>
    </td>
  </tr></table>`;
}

// ── The reminder email ──────────────────────────────────────────────────────
export function reminderEmail({ items, now, timeZone, unsubscribeUrl }) {
  const tz = validTimeZone(timeZone);
  const ordered = [...items].sort((a, b) => a.contest.start - b.contest.start);
  const soon = ordered.filter((i) => i.kind === "hour");
  const later = ordered.filter((i) => i.kind === "day");

  // "Reminder: A, B start in an hour; C starts tomorrow at 8:00 PM IST"
  const verb = (list) => (list.length > 1 ? "start" : "starts");
  const names = (list) => list.map((i) => i.contest.name).join(", ");
  const parts = [];
  if (soon.length) parts.push(`${names(soon)} ${verb(soon)} ${startsIn(soon[0].contest.start - now)}`);
  if (later.length) {
    const sameTime = later.every((i) => i.contest.start === later[0].contest.start);
    const when = sameTime ? relativeWhen(later[0].contest.start, now, tz) : dayWord(later[0].contest.start, now, tz).toLowerCase();
    parts.push(`${names(later)} ${verb(later)} ${when}`);
  }
  const subject = `Reminder: ${parts.join("; ")}`;

  const html = page(
    `${ordered.map((i) => contestBlock(i, now, tz)).join("")}
    ${signOff}
    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af">You're receiving this because you turned on contest reminders.
      <a href="${esc(unsubscribeUrl)}" style="color:#9ca3af">Unsubscribe</a></p>`
  );

  const text = [
    ...ordered.map((i) => {
      const c = i.contest;
      const when = i.kind === "hour" ? `starts ${startsIn(c.start - now)} (${timeOf(c.start, tz)})` : `${relativeWhen(c.start, now, tz)}`;
      return `${c.name} (${PLATFORMS[c.platform].label}): ${when}, ${duration(c.durationMin)}\n${c.url}`;
    }),
    `Good luck,\nInterviewPlanPrep\n${SITE_URL}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n\n");

  return { subject, html, text };
}

// ── The confirmation email (for addresses nobody has verified yet) ──────────
export function confirmEmail({ confirmUrl }) {
  const subject = "Confirm your contest reminders";
  const html = page(
    `<p style="margin:0 0 12px">Please confirm you'd like an email a day before and an hour before each upcoming LeetCode, Codeforces and CodeChef contest.</p>
    <p style="margin:0 0 12px"><a href="${esc(confirmUrl)}" style="${LINK}">Confirm reminders &rarr;</a></p>
    <p style="margin:0;color:#6b7280">If you didn't ask for this, ignore this email and you won't hear from us.</p>
    ${signOff.replace("Good luck,", "Thanks,")}`
  );
  const text = `Please confirm you'd like an email a day before and an hour before each upcoming LeetCode, Codeforces and CodeChef contest:\n${confirmUrl}\n\nIf you didn't ask for this, ignore this email.\n\nThanks,\nInterviewPlanPrep\n${SITE_URL}`;
  return { subject, html, text };
}

// ── A sample, for trying the email out ──────────────────────────────────────
// Real upcoming contests, re-timed so the email shows both kinds: the first
// as if it started in an hour, the second as if it started this time
// tomorrow. Used by the job's ?test=1 and by local previews.
export function sampleReminders(contests, now) {
  const fallback = {
    id: "leetcode:weekly-contest-sample",
    platform: "leetcode",
    name: "Weekly Contest (sample)",
    url: "https://leetcode.com/contest/",
    durationMin: 90,
  };
  const [first = fallback, second] = contests;
  const items = [{ contest: { ...first, start: now + 60 * MIN }, kind: "hour", key: "sample:hour" }];
  if (second) items.push({ contest: { ...second, start: now + 24 * HOUR }, kind: "day", key: "sample:day" });
  return items;
}
