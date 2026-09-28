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

function until(ms) {
  const min = Math.max(1, Math.round(ms / MIN));
  if (min < 60) return `${min} min`;
  if (min < 90) return min === 60 ? "1 hour" : `1 hr ${min - 60} min`;
  return `${Math.round(min / 60)} hours`;
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

function timeShort(start, tz) {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz })
    .format(start)
    .replace(/\b(am|pm)\b/, (x) => x.toUpperCase());
}

const PLATFORM_COLOR = { leetcode: "#c77700", codeforces: "#1a6fa3", codechef: "#6b4428" };
const PLATFORM_TINT = { leetcode: "#fff4e0", codeforces: "#e6f2fa", codechef: "#f4ece5" };
const logoUrl = (platform) => `${SITE_URL}/email/${platform}.png`;

// Google Calendar's "add event" link — the day-before email offers it.
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

// One short line under the button, picked by contest so it varies.
const TIPS = {
  hour: [
    "Warm up with one easy problem before it starts.",
    "Water, snacks, one warm-up problem. You're set.",
    "Read every problem first, then start with the one you're surest of.",
  ],
  day: [
    "Block the slot on your calendar now.",
    "A short timed practice today makes tomorrow easier.",
    "Sleep well. Contests reward a fresh mind.",
  ],
};
function tipFor(i) {
  const list = TIPS[i.kind];
  let h = 0;
  for (const ch of i.contest.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// The shared frame: violet header band with the brand, then a white panel.
function frame({ preheader, eyebrow, headline, subline, body, footer }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:${FONT}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff">
<tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px -18px rgba(76,29,149,.35)">
    <tr><td style="background:#6d28d9;background-image:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);padding:26px 28px 30px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle"><img src="${SITE_URL}/email/mark.png" width="26" height="26" alt="" style="display:block;border:0;border-radius:7px"></td>
        <td style="vertical-align:middle;padding-left:9px;font-size:15px;font-weight:800;color:#ffffff;letter-spacing:-.01em">InterviewPlanPrep</td>
      </tr></table>
      <div style="margin-top:26px"><span style="display:inline-block;padding:5px 11px;border-radius:999px;background:rgba(255,255,255,.16);color:#ede9fe;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${esc(eyebrow)}</span></div>
      <div style="margin-top:12px;font-size:30px;line-height:1.15;font-weight:800;color:#ffffff;letter-spacing:-.02em">${esc(headline)}</div>
      ${subline ? `<div style="margin-top:8px;font-size:15px;line-height:1.5;color:#ddd6fe">${esc(subline)}</div>` : ""}
    </td></tr>
    <tr><td style="padding:26px 28px 28px">${body}</td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td align="center" style="padding:18px 16px 0;font-size:12px;line-height:1.6;color:#8b87a8">${footer}</td></tr>
  </table>
</td></tr></table></body></html>`;
}

function logoTile(platform, size) {
  const img = Math.round(size * 0.66);
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="${size}" height="${size}" align="center" valign="middle" style="width:${size}px;height:${size}px;border-radius:${Math.round(size / 3.5)}px;background:${PLATFORM_TINT[platform]}">
    <img src="${logoUrl(platform)}" width="${img}" height="${img}" alt="${esc(PLATFORMS[platform].label)}" style="display:block;border:0">
  </td></tr></table>`;
}

const chip = (text) =>
  `<span style="display:inline-block;margin:0 6px 6px 0;padding:6px 11px;border-radius:999px;background:#f3f4f6;color:#374151;font-size:13px;font-weight:600">${esc(text)}</span>`;

function button(href, label) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#6d28d9" style="border-radius:12px;background:#6d28d9;background-image:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)">
    <a href="${esc(href)}" style="display:block;padding:14px 18px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px">${esc(label)}</a>
  </td></tr></table>`;
}

// ── The reminder email ──────────────────────────────────────────────────────
// Leads with the most urgent contest; anything else due in the same run
// follows as compact rows.
export function reminderEmail({ items, now, timeZone, unsubscribeUrl }) {
  const tz = validTimeZone(timeZone);
  const ordered = [...items].sort((a, b) => (a.kind === b.kind ? a.contest.start - b.contest.start : a.kind === "hour" ? -1 : 1));
  const [main, ...rest] = ordered;
  const c = main.contest;
  const p = PLATFORMS[c.platform];

  const whenLine = (i) =>
    i.kind === "hour"
      ? `Starts in ${until(i.contest.start - now)}`
      : `${dayWord(i.contest.start, now, tz)}, ${timeShort(i.contest.start, tz)}`;
  // Countdown or day, then the rest of the when, never the time twice.
  const metaLine = (i) =>
    i.kind === "hour"
      ? `Starts in ${until(i.contest.start - now)} · ${timeOf(i.contest.start, tz)}`
      : `${dayWord(i.contest.start, now, tz)}, ${dateOf(i.contest.start, tz)} · ${timeOf(i.contest.start, tz)}`;

  const subject =
    (main.kind === "hour"
      ? `⏰ Starts in ${until(c.start - now)}: ${c.name} (${p.label})`
      : `📅 ${dayWord(c.start, now, tz)} at ${timeOf(c.start, tz)}: ${c.name} (${p.label})`) +
    (rest.length ? ` + ${rest.length} more` : "");

  const eyebrow = main.kind === "hour" ? "Starting soon" : "Heads up";
  const headline = whenLine(main);
  const subline = main.kind === "hour" ? `${timeOf(c.start, tz)}. Time to get ready.` : "Plan your day around it.";

  const others = rest.length
    ? `<div style="margin-top:28px;padding-top:20px;border-top:1px solid #ede9fe">
        <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8b87a8">Also coming up</div>
        ${rest
          .map(
            (i) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px"><tr>
          <td width="40" valign="middle">${logoTile(i.contest.platform, 40)}</td>
          <td valign="middle" style="padding-left:12px">
            <div style="font-size:14px;font-weight:700;color:#111827">${esc(i.contest.name)}</div>
            <div style="margin-top:2px;font-size:13px;color:#6b7280">${esc(metaLine(i))} · ${esc(duration(i.contest.durationMin))}</div>
          </td>
          <td align="right" valign="middle" style="white-space:nowrap;padding-left:12px"><a href="${esc(i.contest.url)}" style="font-size:13px;font-weight:700;color:#6d28d9;text-decoration:none">Open &rarr;</a></td>
        </tr></table>`
          )
          .join("")}
      </div>`
    : "";

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="56" valign="middle">${logoTile(c.platform, 56)}</td>
      <td valign="middle" style="padding-left:14px">
        <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${PLATFORM_COLOR[c.platform]}">${esc(p.label)}</div>
        <div style="margin-top:3px;font-size:20px;line-height:1.3;font-weight:800;color:#111827">${esc(c.name)}</div>
      </td>
    </tr></table>
    <div style="margin-top:18px">${chip(dateOf(c.start, tz))}${chip(timeOf(c.start, tz))}${chip(duration(c.durationMin))}</div>
    <div style="margin-top:16px">${button(c.url, "Open contest →")}</div>
    ${
      main.kind === "day"
        ? `<div style="margin-top:14px;text-align:center"><a href="${esc(calendarUrl(c))}" style="font-size:13px;font-weight:700;color:#6d28d9;text-decoration:none">+ Add to Google Calendar</a></div>`
        : ""
    }
    <div style="margin-top:18px;text-align:center;font-size:13px;color:#6b7280">${esc(tipFor(main))} Good luck!</div>
    ${others}`;

  const footer = `You're getting this because you turned on contest reminders on
    <a href="${SITE_URL}/contests" style="color:#8b87a8">InterviewPlanPrep</a>.<br>
    <a href="${esc(unsubscribeUrl)}" style="color:#8b87a8">Unsubscribe</a>`;

  const html = frame({
    preheader: `${c.name} · ${p.label} · ${timeOf(c.start, tz)}`,
    eyebrow,
    headline,
    subline,
    body,
    footer,
  });

  const textRow = (i) =>
    `${i.contest.name} (${PLATFORMS[i.contest.platform].label}) — ${metaLine(i)} · ${duration(i.contest.durationMin)}\n${i.contest.url}`;
  const text = [
    textRow(main),
    main.kind === "day" ? `Add to Google Calendar: ${calendarUrl(c)}` : "",
    rest.length ? "Also coming up:\n" + rest.map(textRow).join("\n\n") : "",
    `${tipFor(main)} Good luck!`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { subject, html, text };
}

// ── The confirmation email (for addresses nobody has verified yet) ──────────
export function confirmEmail({ confirmUrl }) {
  const subject = "Confirm your contest reminders";
  const logos = ["leetcode", "codeforces", "codechef"]
    .map((k) => `<td style="padding-right:8px">${logoTile(k, 40)}</td>`)
    .join("");
  const body = `
    <div style="font-size:15px;line-height:1.6;color:#374151">One click and you'll get an email a day before and an hour before each upcoming contest on</div>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:14px"><tr>${logos}</tr></table>
    <div style="margin-top:22px">${button(confirmUrl, "Confirm reminders")}</div>
    <div style="margin-top:16px;text-align:center;font-size:12px;color:#8b87a8">Didn't ask for this? Ignore this email and you won't hear from us.</div>`;
  const html = frame({
    preheader: "One click to start getting contest reminders.",
    eyebrow: "One last step",
    headline: "Confirm your contest reminders",
    subline: "LeetCode, Codeforces and CodeChef, right on time.",
    body,
    footer: `<a href="${SITE_URL}/contests" style="color:#8b87a8">InterviewPlanPrep</a>`,
  });
  const text = `Confirm this address to get contest reminders a day and an hour before each LeetCode, Codeforces and CodeChef contest:\n${confirmUrl}\n\nDidn't ask for this? Ignore this email.`;
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
