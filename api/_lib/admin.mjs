import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Firebase Admin for the server functions: it reads every subscriber (which
// the browser never can — the Firestore rules deny these collections) and
// checks the ID token a signed-in visitor sends.
//
// FIREBASE_SERVICE_ACCOUNT holds the service-account JSON from the Firebase
// console (Project settings → Service accounts → Generate new private key).

export function adminConfigured(env = process.env) {
  return !!env.FIREBASE_SERVICE_ACCOUNT;
}

function app() {
  if (getApps().length) return getApps()[0];
  const account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  // Pasted into a dashboard, the key's newlines often arrive as literal "\n".
  if (account.private_key) account.private_key = account.private_key.replace(/\\n/g, "\n");
  return initializeApp({ credential: cert(account) });
}

export const db = () => getFirestore(app());
export const auth = () => getAuth(app());

// The signed-in visitor behind a request, from its "Authorization: Bearer
// <Firebase ID token>" header — or null.
export async function verifiedUser(request) {
  const m = /^Bearer (.+)$/.exec(request.headers.get("authorization") || "");
  if (!m) return null;
  try {
    return await auth().verifyIdToken(m[1]);
  } catch (_) {
    return null;
  }
}

export const SUBSCRIBERS = "contestSubscribers";
export const SENT = "contestReminders";
