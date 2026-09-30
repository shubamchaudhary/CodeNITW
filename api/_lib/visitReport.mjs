import { SITE_URL } from "./reminders.mjs";

// The nightly visitors email to the owner: the day's headline numbers, then
// where people went, where they came from, what they used, and who signed in.
// Plain tables and inline styles, like the reminder emails, so every mail app
// shows it the same way.

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const n = (v) => Number(v || 0).toLocaleString("en-IN");
const time = (ms) =>
  new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(ms);

function tile(label, value) {
  return `<td width="25%" style="padding:4px">
    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:10px 12px;background:#ffffff">
      <div style="font-size:11px;color:#6b7280">${esc(label)}</div>
      <div style="font-size:20px;font-weight:700;color:#111827;margin-top:2px">${esc(value)}</div>
    </div>
  </td>`;
}

function list(title, rows, left, right) {
  if (!rows.length) return "";
  const body = rows
    .map(
      (r) => `<tr>
        <td style="padding:6px 0;border-top:1px solid #f3f4f6;font-size:13px;color:#374151;word-break:break-all">${esc(left(r))}</td>
        <td align="right" style="padding:6px 0 6px 12px;border-top:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:600;white-space:nowrap">${esc(right(r))}</td>
      </tr>`
    )
    .join("");
  return `<tr><td style="padding:14px 2px 4px;font-size:12px;font-weight:700;color:#6b7280">${esc(title)}</td></tr>
  <tr><td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:6px 14px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${body}</table>
  </td></tr>`;
}

// stats: aggregate() over the day; label: "2026-09-30" or "the last 24 hours".
export function reportEmail(stats, { label }) {
  const t = stats.totals;
  const when = /^\d{4}-\d{2}-\d{2}$/.test(label)
    ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(Date.parse(label))
    : label;
  const subject = t.visitors
    ? `InterviewPlanPrep: ${n(t.visitors)} visitor${t.visitors === 1 ? "" : "s"}, ${n(t.views)} page views on ${when}`
    : `InterviewPlanPrep: no visitors on ${when}`;

  const users = stats.users.slice(0, 15);
  const inner = t.visitors
    ? `<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        ${tile("Visitors", n(t.visitors))}${tile("Page views", n(t.views))}${tile("Sessions", n(t.sessions))}${tile("Signed in", n(t.signedInVisitors))}
      </tr></table></td></tr>
      <tr><td style="padding:6px 4px 0;font-size:12.5px;color:#6b7280">${n(t.newVisitors)} new · ${n(stats.devices.mobile)} on mobile, ${n(stats.devices.desktop)} on desktop · ${n(t.signUps)} new account${t.signUps === 1 ? "" : "s"} · ${n(t.signIns)} sign-in${t.signIns === 1 ? "" : "s"}</td></tr>
      ${list("Signed-in visitors", users, (u) => `${u.name || "No name"} · ${u.email || u.uid} · ${u.place}`, (u) => `${n(u.views)} views · ${time(u.lastSeen)}`)}
      ${list("Top pages", stats.pages.slice(0, 6), (r) => r.path, (r) => `${n(r.views)} views`)}
      ${list("Where from", stats.places.slice(0, 6), (r) => r.place, (r) => `${n(r.visitors)} visitor${r.visitors === 1 ? "" : "s"}`)}
      ${list("Came from", stats.referrers.slice(0, 5), (r) => r.host, (r) => `${n(r.visitors)}`)}
      ${list("Browsers", stats.browsers.slice(0, 4), (r) => r.name, (r) => `${n(r.visitors)}`)}`
    : `<tr><td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;font-size:14px;color:#374151">Nobody visited ${esc(when)}.</td></tr>`;

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;font-family:${FONT}">
<tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td style="padding:0 2px 4px"><a href="${SITE_URL}" style="font-size:18px;font-weight:800;color:#111827;text-decoration:none">Interview<span style="color:#7c3aed">Plan</span>Prep</a></td></tr>
    <tr><td style="padding:0 2px 12px;font-size:13px;color:#6b7280">Visitors · ${esc(when)} (India time)</td></tr>
    ${inner}
    <tr><td style="padding:16px 2px 0;font-size:12px;color:#6b7280"><a href="${SITE_URL}" style="color:#7c3aed;font-weight:600;text-decoration:none">InterviewPlanPrep</a> · your own visits aren't counted</td></tr>
  </table>
</td></tr></table></body></html>`;

  const text = [
    `Visitors · ${when} (India time)`,
    `${n(t.visitors)} visitors · ${n(t.views)} page views · ${n(t.sessions)} sessions · ${n(t.signedInVisitors)} signed in`,
    users.length ? "Signed in:\n" + users.map((u) => `  ${u.name || "No name"} <${u.email || u.uid}> · ${u.place} · ${n(u.views)} views`).join("\n") : "",
    stats.pages.length ? "Top pages:\n" + stats.pages.slice(0, 6).map((r) => `  ${r.path} · ${n(r.views)}`).join("\n") : "",
    stats.places.length ? "Where from:\n" + stats.places.slice(0, 6).map((r) => `  ${r.place} · ${n(r.visitors)}`).join("\n") : "",
    `InterviewPlanPrep: ${SITE_URL}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { subject, html, text };
}
