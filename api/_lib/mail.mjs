import nodemailer from "nodemailer";

// Mail goes out through a Gmail account (GMAIL_USER) with an app password
// (GMAIL_APP_PASSWORD — Google Account → Security → App passwords). Sending
// from Gmail's own servers keeps it out of spam without owning a domain;
// the account's limit is about 500 recipients a day.

export function mailConfigured(env = process.env) {
  return !!(env.GMAIL_USER && env.GMAIL_APP_PASSWORD);
}

let transport;
function transporter() {
  transport ||= nodemailer.createTransport({
    service: "gmail",
    pool: true,
    maxConnections: 1,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  return transport;
}

export function sendMail({ to, subject, html, text, unsubscribeUrl }) {
  return transporter().sendMail({
    from: { name: "InterviewPlanPrep", address: process.env.GMAIL_USER },
    to,
    subject,
    html,
    text,
    // One-click unsubscribe from the mail app's own button (RFC 8058).
    headers: unsubscribeUrl
      ? { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
      : undefined,
  });
}

export function closeMail() {
  transport?.close();
  transport = undefined;
}
