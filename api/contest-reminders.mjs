import { FieldValue } from "firebase-admin/firestore";
import { SENT, SUBSCRIBERS, adminConfigured, db } from "./_lib/admin.mjs";
import { getContests } from "./_lib/contestCache.mjs";
import { closeMail, mailConfigured, sendMail } from "./_lib/mail.mjs";
import { dueReminders, linkUrl, reminderEmail, sampleReminders } from "./_lib/reminders.mjs";

// The reminder job, called with "Authorization: Bearer <CRON_SECRET>" by:
//   • Vercel Cron (vercel.json) — 96 daily jobs, four per hour. The Hobby plan
//     runs each job once a day at some minute within its hour, which together
//     makes a run roughly every 15 minutes; Vercel sends CRON_SECRET itself.
//   • GitHub Actions (.github/workflows/contest-reminders.yml) as a backup;
//     GitHub's schedule is best-effort and can skip runs for hours.
// Extra or overlapping runs are harmless (see below). Each run emails every confirmed
// subscriber the day-before and hour-before reminders that are due now and
// that they haven't had yet — one email per person per run, however many
// contests are in it.
//
// Delivery is tracked per person: each reminder has a document
// (contestReminders/{key}) whose `sentTo` map lists who it has reached. A
// transaction adds this run's recipients before anything is sent, so
// overlapping or repeated runs never email anyone twice — and someone who
// subscribes after a reminder first went out still gets it while it's due.
// A send that fails takes the person back off the list, so the next run
// retries.
//
// ?dryRun=1 lists what is due without claiming or sending anything.
// ?test=1 emails a sample reminder to GMAIL_USER only (the site's own
// address), to check the setup and see the email — nothing is recorded.

const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Add to a reminder's sentTo whichever of `people` it hasn't reached yet;
// returns those. Runs in a transaction, so two runs can't both claim someone.
function claim(reminder, people) {
  const ref = db().collection(SENT).doc(reminder.key);
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const sentTo = (snap.exists && snap.get("sentTo")) || {};
    const fresh = people.filter((p) => !sentTo[p.id]);
    if (!fresh.length) return [];
    const now = Date.now();
    tx.set(
      ref,
      {
        contestId: reminder.contest.id,
        name: reminder.contest.name,
        kind: reminder.kind,
        start: new Date(reminder.contest.start),
        sentTo: Object.fromEntries(fresh.map((p) => [p.id, now])),
      },
      { merge: true }
    );
    return fresh;
  });
}

function release(reminder, personId) {
  return db()
    .collection(SENT)
    .doc(reminder.key)
    .update({ [`sentTo.${personId}`]: FieldValue.delete() })
    .catch(() => {});
}

async function run(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return json({ error: "unauthorized" }, 401);
  }
  const params = new URL(request.url).searchParams;
  const now = Date.now();

  if (params.has("test")) {
    if (!mailConfigured()) return json({ error: "not-configured" }, 503);
    const { contests } = await getContests(now);
    const to = process.env.GMAIL_USER;
    const unsubscribeUrl = linkUrl("unsubscribe", "test", secret); // points at no real subscriber
    const mail = reminderEmail({ items: sampleReminders(contests, now), upcoming: contests, now, timeZone: "Asia/Kolkata", unsubscribeUrl });
    try {
      await sendMail({ to, unsubscribeUrl, ...mail, subject: `[Test] ${mail.subject}` });
    } catch (e) {
      return json({ error: "send-failed", detail: String(e?.message || e) }, 502);
    } finally {
      closeMail();
    }
    return json({ test: true, sentTo: to, subject: `[Test] ${mail.subject}` });
  }

  if (!adminConfigured() || !mailConfigured()) return json({ error: "not-configured" }, 503);

  // The shared cache: a platform that's down right now still has its last
  // known contests, so their reminders go out anyway.
  const { contests, failed: unreachable } = await getContests(now);
  const due = dueReminders(contests, now);

  if (params.has("dryRun")) {
    return json({
      now: new Date(now).toISOString(),
      upcoming: contests.length,
      due: due.map((d) => ({ key: d.key, kind: d.kind, name: d.contest.name, start: new Date(d.contest.start).toISOString() })),
      unreachable,
    });
  }

  if (!due.length) return json({ due: 0, sent: 0, unreachable });

  const subscribers = (await db().collection(SUBSCRIBERS).where("confirmed", "==", true).get()).docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
  if (!subscribers.length) return json({ due: due.length, subscribers: 0, sent: 0, unreachable });

  // Who still needs which reminder.
  const inbox = new Map(); // subscriber id → reminders to send them now
  for (const d of due) {
    for (const person of await claim(d, subscribers)) {
      if (!inbox.has(person.id)) inbox.set(person.id, []);
      inbox.get(person.id).push(d);
    }
  }
  if (!inbox.size) return json({ due: due.length, subscribers: subscribers.length, sent: 0, unreachable });

  let sent = 0;
  const failures = [];
  try {
    for (const person of subscribers) {
      const items = inbox.get(person.id);
      if (!items) continue;
      const unsubscribeUrl = linkUrl("unsubscribe", person.id, secret);
      try {
        await sendMail({
          to: person.email,
          unsubscribeUrl,
          ...reminderEmail({ items, upcoming: contests, now, timeZone: person.timeZone, unsubscribeUrl }),
        });
        sent++;
      } catch (e) {
        failures.push(String(e?.message || e));
        await Promise.all(items.map((d) => release(d, person.id)));
      }
    }
  } finally {
    closeMail();
  }

  if (!sent && failures.length) {
    console.error("contest reminders: every send failed", failures[0]);
    return json({ error: "send-failed", detail: failures[0] }, 502);
  }
  return json({ due: due.length, subscribers: subscribers.length, sent, failed: failures.length, unreachable });
}

export const GET = run;
export const POST = run;
