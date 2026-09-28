import { FieldValue } from "firebase-admin/firestore";
import { SENT, SUBSCRIBERS, adminConfigured, db } from "./_lib/admin.mjs";
import { fetchUpcomingContests } from "./_lib/contests.mjs";
import { closeMail, mailConfigured, sendMail } from "./_lib/mail.mjs";
import { dueReminders, linkUrl, reminderEmail } from "./_lib/reminders.mjs";

// The reminder job. Something calls it every ~10 minutes (the GitHub Actions
// workflow in .github/workflows/contest-reminders.yml) with
// "Authorization: Bearer <CRON_SECRET>". Each run emails every confirmed
// subscriber about the contests whose day-before or hour-before reminder is
// now due — one email per person per run, however many contests are in it.
//
// Every reminder is claimed in Firestore (contestReminders/{key}) before it
// is sent, with create(), which fails if the key already exists. Overlapping
// or repeated runs therefore never send the same reminder twice.
//
// ?dryRun=1 lists what is due without claiming or sending anything.

const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const alreadyExists = (e) => e?.code === 6 || /ALREADY_EXISTS/i.test(String(e?.message));

async function run(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return json({ error: "unauthorized" }, 401);
  }
  if (!adminConfigured() || !mailConfigured()) return json({ error: "not-configured" }, 503);

  const now = Date.now();
  const { contests, errors } = await fetchUpcomingContests({ now });
  const due = dueReminders(contests, now);

  if (new URL(request.url).searchParams.has("dryRun")) {
    return json({
      now: new Date(now).toISOString(),
      upcoming: contests.length,
      due: due.map((d) => ({ key: d.key, kind: d.kind, name: d.contest.name, start: new Date(d.contest.start).toISOString() })),
      errors,
    });
  }

  const sentLog = db().collection(SENT);
  const claimed = [];
  for (const d of due) {
    try {
      await sentLog.doc(d.key).create({
        contestId: d.contest.id,
        name: d.contest.name,
        kind: d.kind,
        start: new Date(d.contest.start),
        claimedAt: FieldValue.serverTimestamp(),
      });
      claimed.push(d);
    } catch (e) {
      if (!alreadyExists(e)) throw e;
    }
  }
  if (!claimed.length) return json({ due: due.length, sent: 0, errors });

  const subscribers = (await db().collection(SUBSCRIBERS).where("confirmed", "==", true).get()).docs;
  let sent = 0;
  const failures = [];
  try {
    for (const s of subscribers) {
      const { email, timeZone } = s.data();
      const unsubscribeUrl = linkUrl("unsubscribe", s.id, secret);
      try {
        await sendMail({ to: email, unsubscribeUrl, ...reminderEmail({ items: claimed, now, timeZone, unsubscribeUrl }) });
        sent++;
      } catch (e) {
        failures.push(String(e?.message || e));
      }
    }
  } finally {
    closeMail();
  }

  if (subscribers.length && !sent) {
    // Nothing went out — most likely the Gmail credentials. Release the
    // claims so the next run tries again while the reminders are still due.
    await Promise.all(claimed.map((d) => sentLog.doc(d.key).delete()));
    console.error("contest reminders: every send failed", failures[0]);
    return json({ error: "send-failed", detail: failures[0], reminders: claimed.map((d) => d.key) }, 502);
  }

  await Promise.all(
    claimed.map((d) =>
      sentLog.doc(d.key).set({ sentAt: FieldValue.serverTimestamp(), recipients: sent, failed: failures.length }, { merge: true })
    )
  );
  return json({ reminders: claimed.map((d) => d.key), subscribers: subscribers.length, sent, failed: failures.length, errors });
}

export const GET = run;
export const POST = run;
