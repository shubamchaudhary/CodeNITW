import { FieldValue } from "firebase-admin/firestore";
import { SUBSCRIBERS, adminConfigured, db } from "./_lib/admin.mjs";
import { SITE_URL, checkLinkToken } from "./_lib/reminders.mjs";

// The links inside the emails: /api/email-link?a=confirm|unsubscribe&u=…&t=…
//
// Opening the link (GET) only shows a page with a button; the change happens
// on POST. Mail providers and security scanners open every link in an email
// to check it, and a plain GET that acted would confirm or unsubscribe on
// their visit. Mail apps' own "Unsubscribe" button (List-Unsubscribe-Post)
// POSTs here directly, which is the one-click path.

const ACTIONS = {
  confirm: {
    ask: "Confirm contest reminders",
    body: "You'll get an email a day before and an hour before each upcoming LeetCode, Codeforces and CodeChef contest.",
    button: "Confirm reminders",
    doneTitle: "Reminders confirmed",
    done: "You're all set. Reminders will arrive a day and an hour before each contest.",
  },
  unsubscribe: {
    ask: "Stop contest reminders?",
    body: "You won't get any more contest reminder emails. You can turn them back on from the Contests page at any time.",
    button: "Unsubscribe",
    doneTitle: "Unsubscribed",
    done: "You're unsubscribed. No more contest reminder emails.",
  },
};

function page(title, message, form = "") {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · InterviewPlanPrep</title>
<style>
  :root{color-scheme:light dark}
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f3f4f6;font:15px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827}
  .card{max-width:420px;margin:24px;padding:28px;background:#fff;border:1px solid #e5e7eb;border-radius:16px}
  .brand{font-weight:800;font-size:18px}.brand span{color:#7c3aed}
  h1{font-size:20px;margin:18px 0 6px}p{color:#4b5563;margin:0 0 18px}
  button{font:inherit;font-weight:600;padding:10px 16px;border:0;border-radius:10px;background:#7c3aed;color:#fff;cursor:pointer}
  a{color:#7c3aed;font-weight:600;text-decoration:none}
  @media (prefers-color-scheme:dark){body{background:#0b1020;color:#f3f4f6}.card{background:#121a30;border-color:#1f2a44}p{color:#9ca3af}}
</style></head><body><div class="card">
  <div class="brand">Interview<span>Plan</span>Prep</div>
  <h1>${title}</h1><p>${message}</p>${form}
  <p style="margin:18px 0 0"><a href="${SITE_URL}/contests">Go to Contests →</a></p>
</div></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

function parse(request) {
  const q = new URL(request.url).searchParams;
  const action = q.get("a");
  const uid = q.get("u");
  const ok = ACTIONS[action] && checkLinkToken(action, uid, q.get("t"), process.env.CRON_SECRET);
  return { action, uid, ok };
}

const invalid = () => page("This link doesn't work", "It may have been copied incompletely. Try the link from the most recent email.");

export async function GET(request) {
  const { action, ok } = parse(request);
  if (!ok) return invalid();
  const a = ACTIONS[action];
  // An empty action posts back to this same URL, query string included.
  return page(a.ask, a.body, `<form method="post"><button type="submit">${a.button}</button></form>`);
}

export async function POST(request) {
  const { action, uid, ok } = parse(request);
  if (!ok) return invalid();
  if (!adminConfigured()) return page("Something went wrong", "Please try again in a little while.");

  const ref = db().collection(SUBSCRIBERS).doc(uid);
  if (action === "unsubscribe") {
    await ref.delete();
  } else {
    const snap = await ref.get();
    if (!snap.exists) {
      return page("Reminders are off", "This account turned reminders off after the email was sent. Turn them on again from the Contests page.");
    }
    await ref.update({ confirmed: true, confirmedAt: FieldValue.serverTimestamp() });
  }
  return page(ACTIONS[action].doneTitle, ACTIONS[action].done);
}
