import { FieldValue } from "firebase-admin/firestore";
import { SUBSCRIBERS, adminConfigured, db, verifiedUser } from "./_lib/admin.mjs";
import { mailConfigured, sendMail } from "./_lib/mail.mjs";
import { confirmEmail, linkUrl, validTimeZone } from "./_lib/reminders.mjs";

// The Contests page's one button: turn contest reminder emails on or off for
// the signed-in account. The address is the account's own, taken from its
// verified ID token — never from the request — so nobody can subscribe
// someone else. An address Google hasn't vouched for (an email + password
// account) gets a confirmation email first, and receives nothing until it's
// confirmed.

const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function configured() {
  return adminConfigured() && mailConfigured() && !!process.env.CRON_SECRET;
}

async function signedIn(request) {
  if (!configured()) return { error: json({ error: "not-configured" }, 503) };
  const user = await verifiedUser(request);
  if (!user) return { error: json({ error: "sign-in" }, 401) };
  return { user };
}

const state = (snap) => ({
  subscribed: snap.exists,
  confirmed: snap.exists && snap.get("confirmed") === true,
  email: snap.exists ? snap.get("email") : null,
});

export async function GET(request) {
  const { user, error } = await signedIn(request);
  if (error) return error;
  return json(state(await db().collection(SUBSCRIBERS).doc(user.uid).get()));
}

export async function POST(request) {
  const { user, error } = await signedIn(request);
  if (error) return error;
  if (!user.email) return json({ error: "no-email" }, 400);

  let body = {};
  try {
    body = await request.json();
  } catch (_) {}

  const ref = db().collection(SUBSCRIBERS).doc(user.uid);
  const before = await ref.get();
  const alreadyConfirmed = before.exists && before.get("confirmed") === true && before.get("email") === user.email;
  const confirmed = user.email_verified === true || alreadyConfirmed;

  const data = {
    email: user.email,
    timeZone: validTimeZone(body.timeZone),
    confirmed,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (!before.exists) data.subscribedAt = FieldValue.serverTimestamp();

  // Confirmation email, at most one every 10 minutes per account.
  let confirmationSent = false;
  const lastSent = before.exists ? before.get("confirmSentAt")?.toMillis?.() || 0 : 0;
  if (!confirmed && Date.now() - lastSent > 10 * 60 * 1000) {
    const confirmUrl = linkUrl("confirm", user.uid, process.env.CRON_SECRET);
    await sendMail({ to: user.email, ...confirmEmail({ confirmUrl }) });
    data.confirmSentAt = FieldValue.serverTimestamp();
    confirmationSent = true;
  }

  await ref.set(data, { merge: true });
  return json({ subscribed: true, confirmed, email: user.email, confirmationSent });
}

export async function DELETE(request) {
  const { user, error } = await signedIn(request);
  if (error) return error;
  await db().collection(SUBSCRIBERS).doc(user.uid).delete();
  return json({ subscribed: false, confirmed: false, email: user.email });
}
