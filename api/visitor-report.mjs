import { adminConfigured, db } from "./_lib/admin.mjs";
import { closeMail, mailConfigured, sendMail } from "./_lib/mail.mjs";
import { OWNER_EMAIL, VISITS, aggregate, istDay, istDayStart } from "./_lib/visits.mjs";
import { reportEmail } from "./_lib/visitReport.mjs";

// The nightly visitors email to the owner, covering yesterday in India time.
// Vercel Cron calls it once a day just after midnight IST (vercel.json), with
// "Authorization: Bearer <CRON_SECRET>" like the contest reminders.
//   ?test=1    email the last 24 hours now, marked [Test]
//   ?dryRun=1  return the numbers, send nothing

const DAY = 24 * 3600 * 1000;
const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function run(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return json({ error: "unauthorized" }, 401);
  if (!adminConfigured() || !mailConfigured()) return json({ error: "not-configured" }, 503);

  const params = new URL(request.url).searchParams;
  const test = params.has("test");
  const now = Date.now();
  const to = test ? now : istDayStart(istDay(now)); // the start of today, India time
  const from = to - DAY;

  const snap = await db().collection(VISITS).where("at", ">=", from).where("at", "<", to).get();
  const stats = aggregate(snap.docs.map((d) => d.data()), { from, to });
  if (params.has("dryRun")) return json({ from, to, ...stats.totals });

  const mail = reportEmail(stats, { label: test ? "the last 24 hours" : istDay(from) });
  try {
    await sendMail({ to: OWNER_EMAIL, subject: test ? `[Test] ${mail.subject}` : mail.subject, html: mail.html, text: mail.text });
  } catch (e) {
    return json({ error: "send-failed", detail: String(e?.message || e) }, 502);
  } finally {
    closeMail();
  }
  return json({ sent: true, to: OWNER_EMAIL, ...stats.totals });
}

export const GET = run;
export const POST = run;
