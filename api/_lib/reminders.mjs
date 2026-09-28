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

const PLATFORM_COLOR = { leetcode: "#d97706", codeforces: "#2563eb", codechef: "#92400e" };

// ── The reminder email ──────────────────────────────────────────────────────
export function reminderEmail({ items, now, timeZone, unsubscribeUrl }) {
  const tz = validTimeZone(timeZone);
  const soon = items.filter((i) => i.kind === "hour");
  const later = items.filter((i) => i.kind === "day");
  // "Coming up tomorrow" only when it's true of every one of them.
  const laterTitle =
    !soon.length && later.every((i) => dayWord(i.contest.start, now, tz) === "Tomorrow") ? "Coming up tomorrow" : "Coming up";

  const label = (i) => `${i.contest.name} (${PLATFORMS[i.contest.platform].label})`;
  let subject;
  if (items.length === 1) {
    const i = items[0];
    subject =
      i.kind === "hour"
        ? `Starts in ${until(i.contest.start - now)}: ${label(i)}`
        : `${dayWord(i.contest.start, now, tz)} at ${timeOf(i.contest.start, tz)}: ${label(i)}`;
  } else {
    subject = `Contest reminders: ${items.map((i) => i.contest.name).join(", ")}`;
  }

  const row = (i) => {
    const c = i.contest;
    const p = PLATFORMS[c.platform];
    const when =
      i.kind === "hour"
        ? `Starts in ${until(c.start - now)} · ${timeOf(c.start, tz)}`
        : `${dayWord(c.start, now, tz)}, ${dateOf(c.start, tz)} · ${timeOf(c.start, tz)}`;
    return `
      <tr><td style="padding:14px 16px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff">
        <div style="font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${PLATFORM_COLOR[c.platform]}">${esc(p.label)}</div>
        <div style="margin-top:4px;font-size:16px;font-weight:700;color:#111827">${esc(c.name)}</div>
        <div style="margin-top:4px;font-size:14px;color:#4b5563">${esc(when)} · ${esc(duration(c.durationMin))}</div>
        <a href="${esc(c.url)}" style="display:inline-block;margin-top:12px;padding:8px 14px;border-radius:8px;background:#7c3aed;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none">Open contest</a>
      </td></tr>
      <tr><td style="height:10px;line-height:10px">&nbsp;</td></tr>`;
  };
  const section = (title, list) =>
    list.length
      ? `<tr><td style="padding:4px 0 10px;font-size:13px;font-weight:700;color:#6b7280">${title}</td></tr>${list.map(row).join("")}`
      : "";

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f3f4f6">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
        <tr><td style="padding:0 0 16px;font-size:18px;font-weight:800;color:#111827">Interview<span style="color:#7c3aed">Plan</span>Prep</td></tr>
        ${section("Starting in about an hour", soon)}
        ${section(laterTitle, later)}
        <tr><td style="padding:10px 0 0;font-size:12px;line-height:1.6;color:#6b7280">
          You're getting this because you turned on contest reminders on
          <a href="${SITE_URL}/contests" style="color:#6b7280">InterviewPlanPrep</a>.
          <a href="${esc(unsubscribeUrl)}" style="color:#6b7280">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;

  const textRow = (i) => {
    const c = i.contest;
    const when = i.kind === "hour" ? `starts in ${until(c.start - now)}, ${timeOf(c.start, tz)}` : `${dayWord(c.start, now, tz)}, ${dateOf(c.start, tz)}, ${timeOf(c.start, tz)}`;
    return `- ${c.name} (${PLATFORMS[c.platform].label}) — ${when}, ${duration(c.durationMin)}\n  ${c.url}`;
  };
  const text = [
    soon.length ? "Starting in about an hour:\n" + soon.map(textRow).join("\n") : "",
    later.length ? `${laterTitle}:\n` + later.map(textRow).join("\n") : "",
    `Unsubscribe: ${unsubscribeUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { subject, html, text };
}

// ── The confirmation email (for addresses nobody has verified yet) ──────────
export function confirmEmail({ confirmUrl }) {
  const subject = "Confirm your contest reminders";
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:24px 12px;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px">
      <tr><td style="padding:20px">
        <div style="font-size:18px;font-weight:800;color:#111827">Interview<span style="color:#7c3aed">Plan</span>Prep</div>
        <p style="font-size:15px;line-height:1.6;color:#374151">Confirm this address to get an email a day before and an hour before each upcoming LeetCode, Codeforces and CodeChef contest.</p>
        <a href="${esc(confirmUrl)}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#7c3aed;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none">Confirm reminders</a>
        <p style="font-size:12px;line-height:1.6;color:#6b7280;margin-top:16px">Didn't ask for this? Ignore this email and you won't hear from us.</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
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
