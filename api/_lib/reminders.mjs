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
  return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`; // one unbreakable unit
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

// "8 AM", "8:30 PM" — for the subject line, in the reader's own time zone.
function clock(start, tz) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz })
    .format(start)
    .replace(":00", "");
}

const PLATFORM_TINT = { leetcode: "#fff4e0", codeforces: "#e6f2fa", codechef: "#f4ece5" };
const logoUrl = (platform) => `${SITE_URL}/email/${platform}.png`;

// Google Calendar's "add event" link.
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
const VIOLET = "#6d28d9";
const COMING_UP = 3;

// The frame: grey page, the name (a link to the site) on top, content, a
// one-line footer.
function page(inner, footer) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;font-family:${FONT}">
<tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
    <tr><td style="padding:0 2px 14px"><a href="${SITE_URL}" style="font-size:18px;font-weight:800;color:#111827;text-decoration:none">Interview<span style="color:#7c3aed">Plan</span>Prep</a></td></tr>
    ${inner}
    <tr><td style="padding:8px 2px 0;font-size:12px;line-height:1.6;color:#6b7280">${footer}</td></tr>
  </table>
</td></tr></table></body></html>`;
}

const sectionTitle = (title) => `<tr><td style="padding:6px 2px 8px;font-size:12px;font-weight:700;color:#6b7280">${esc(title)}</td></tr>`;

// One contest on one thin row: icon · name and when · Open contest.
function card(c, meta, { calendar = false } = {}) {
  const p = PLATFORMS[c.platform];
  const cal = calendar
    ? ` · <a href="${esc(calendarUrl(c))}" style="color:${VIOLET};font-weight:600;text-decoration:none">Add to calendar</a>`
    : "";
  return `<tr><td style="padding:0 0 8px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px">
    <tr>
      <td width="34" valign="middle" style="padding:10px 0 10px 12px">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="34" height="34" align="center" valign="middle" style="width:34px;height:34px;border-radius:9px;background:${PLATFORM_TINT[c.platform]}">
          <img src="${logoUrl(c.platform)}" width="22" height="22" alt="${esc(p.label)}" title="${esc(p.label)}" style="display:block;border:0">
        </td></tr></table>
      </td>
      <td valign="middle" style="padding:10px 12px">
        <div style="font-size:14px;line-height:1.35;font-weight:700;color:#111827">${esc(c.name)}</div>
        <div style="margin-top:2px;font-size:12.5px;line-height:1.5;color:#6b7280">${esc(meta)}${cal}</div>
      </td>
      <td align="right" valign="middle" style="padding:10px 12px 10px 0;white-space:nowrap">
        <a href="${esc(c.url)}" style="display:inline-block;padding:7px 12px;border-radius:8px;background:#7c3aed;color:#ffffff;font-size:12.5px;font-weight:700;text-decoration:none">Open contest</a>
      </td>
    </tr>
  </table>
</td></tr>`;
}

// "CodeChef contest", "2 Codeforces contests", "CodeChef and LeetCode contests"
function whose(list) {
  const platforms = [...new Set(list.map((i) => PLATFORMS[i.contest.platform].label))];
  if (list.length === 1) return `${platforms[0]} contest`;
  if (platforms.length === 1) return `${list.length} ${platforms[0]} contests`;
  return `${platforms.slice(0, -1).join(", ")} and ${platforms.at(-1)} contests`;
}

// ── The reminder email ──────────────────────────────────────────────────────
// `items` are the reminders due now; `upcoming` is every known upcoming
// contest, from which the next few fill "Coming up".
export function reminderEmail({ items, upcoming = [], now, timeZone, unsubscribeUrl }) {
  const tz = validTimeZone(timeZone);
  const byStart = (a, b) => a.contest.start - b.contest.start;
  const soon = items.filter((i) => i.kind === "hour").sort(byStart);
  const later = items.filter((i) => i.kind === "day").sort(byStart);

  // Contest reminder: CodeChef contest starts in an hour
  // Contest reminder: LeetCode contest starts tomorrow at 8 AM
  const lead = soon.length ? soon : later;
  const plural = lead.length > 1;
  const first = lead[0].contest;
  const dayPhrase = (t) => {
    const d = dayWord(t, now, tz);
    return d === "Today" || d === "Tomorrow" ? d.toLowerCase() : `on ${d}`;
  };
  const sameStart = lead.every((i) => i.contest.start === first.start);
  const when = soon.length
    ? startsIn(first.start - now)
    : sameStart
    ? `${dayPhrase(first.start)} at ${clock(first.start, tz)}`
    : dayPhrase(first.start);
  const subject = `Contest reminder: ${whose(lead)} ${plural ? "start" : "starts"} ${when}`;

  const shown = new Set(items.map((i) => i.contest.id));
  const next = upcoming
    .filter((c) => !shown.has(c.id) && c.start > now)
    .sort((a, b) => a.start - b.start)
    .slice(0, COMING_UP);

  const fullWhen = (c) => `${dateOf(c.start, tz)} · ${timeOf(c.start, tz)} · ${duration(c.durationMin)}`;
  const allTomorrow = later.every((i) => dayWord(i.contest.start, now, tz) === "Tomorrow");

  let inner = "";
  if (soon.length) {
    inner += sectionTitle(soon.every((i) => i.contest.start - now >= 45 * MIN) ? "Starting in about an hour" : "Starting soon");
    inner += soon.map((i) => card(i.contest, `${timeOf(i.contest.start, tz)} · ${duration(i.contest.durationMin)}`)).join("");
  }
  if (later.length) {
    inner += sectionTitle(allTomorrow ? "Tomorrow" : "Within a day");
    inner += later.map((i) => card(i.contest, fullWhen(i.contest), { calendar: true })).join("");
  }
  if (next.length) {
    inner += sectionTitle("Coming up");
    inner += next.map((c) => card(c, fullWhen(c), { calendar: true })).join("");
  }

  const footer = `You're getting this because you turned on contest reminders on
    <a href="${SITE_URL}/contests" style="color:#6b7280">InterviewPlanPrep</a>.
    <a href="${esc(unsubscribeUrl)}" style="color:#6b7280">Unsubscribe</a>`;

  const html = page(inner, footer);

  const line = (c, m) => `${c.name} (${PLATFORMS[c.platform].label}), ${m}\n${c.url}`;
  const text = [
    soon.length ? "Starting in about an hour:\n" + soon.map((i) => line(i.contest, `${timeOf(i.contest.start, tz)}, ${duration(i.contest.durationMin)}`)).join("\n") : "",
    later.length ? `${allTomorrow ? "Tomorrow" : "Within a day"}:\n` + later.map((i) => line(i.contest, fullWhen(i.contest))).join("\n") : "",
    next.length ? "Coming up:\n" + next.map((c) => line(c, fullWhen(c))).join("\n") : "",
    `InterviewPlanPrep: ${SITE_URL}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { subject, html, text };
}

// ── The confirmation email (for addresses nobody has verified yet) ──────────
export function confirmEmail({ confirmUrl }) {
  const subject = "Confirm your contest reminders";
  const inner = `<tr><td style="padding:0 0 8px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px">
    <tr><td style="padding:18px 18px 20px;font-size:14px;line-height:1.6;color:#374151">
      Please confirm you'd like an email a day before and an hour before each upcoming LeetCode, Codeforces and CodeChef contest.
      <div style="margin-top:14px"><a href="${esc(confirmUrl)}" style="display:inline-block;padding:8px 14px;border-radius:8px;background:#7c3aed;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none">Confirm reminders</a></div>
    </td></tr>
  </table>
</td></tr>`;
  const html = page(inner, "Didn't ask for this? Ignore this email and you won't hear from us.");
  const text = `Please confirm you'd like an email a day before and an hour before each upcoming LeetCode, Codeforces and CodeChef contest:\n${confirmUrl}\n\nDidn't ask for this? Ignore this email.\n\nInterviewPlanPrep: ${SITE_URL}`;
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
