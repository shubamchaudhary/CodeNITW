import type { Scene } from "../../lib/types.ts";
import { B, sec } from "../ll01/h.ts";
import { check } from "./k.ts";

// Part 3: compare-and-swap in the rules, the admin SDK, limits and cost, and
// the answers to give.
export const p3: Scene[] = [
  // ------------------------------------------------------------ 9
  sec("9", "Compare-and-swap in the rules", "Topic nine. Compare and swap, inside the security rules. The cleverest line in your project, so let's make it unshakeable."),
  {
    kind: "code",
    title: "firestore.rules: notes are fast-forward only",
    lang: "js",
    code: `match /notes/{noteId} {
  allow update: if signedInAs(uid) && validNote(noteId)
    && request.resource.data.key == resource.data.key
    && request.resource.data.id  == resource.data.id
    && request.resource.data.base == resource.data.rev;  // built on the head?
}
function validNote(noteId) {      // only these fields, and exactly one step up
  let n = request.resource.data;
  return n.keys().hasOnly(['key','id','value','deleted','rev','base','updatedAt'])
    && n.rev == n.base + 1 && noteId.matches(n.key + '~.+');
}`,
    highlight: [[2, 2], [5, 5], [9, 10]],
    beats: B(
      "Here's the rule for a note's document. An update is allowed only if you're the owner, and the note is valid, and the key and id are unchanged, and one more line.",
      { say: "The base this save was built on must equal the revision stored right now. In words: I built this on revision seven, and seven is still the head. If the head has moved to eight, the save is refused.", tone: "key" },
      "And valid note says: only these seven fields, the new revision is exactly the base plus one, and the document id matches its key. So a save can't skip revisions or smuggle in other fields.",
    ),
  },
  {
    kind: "seq",
    title: "A stale phone meets the rule",
    actors: [
      { id: "p", name: "Phone (offline edit)", icon: "📱" },
      { id: "r", name: "Rules", icon: "🛡" },
      { id: "d", name: "notes/{key}~{id}", icon: "📄" },
    ],
    msgs: [
      { from: "p", to: "r", label: "save: base 7 → rev 8", step: 1 },
      { from: "r", to: "d", label: "stored rev is 8 (laptop)", step: 2, dash: true },
      { from: "r", to: "p", label: "permission-denied", step: 3, tone: "red" },
      { from: "p", to: "d", label: "fetch head · merge3 against base 7", step: 4 },
      { from: "p", to: "r", label: "save: base 8 → rev 9 ✓", step: 5, tone: "green" },
    ],
    note: { step: 6, text: "same lines changed on both? the head stands; ours goes to History as \"not kept\"", tone: "amber" },
    beats: B(
      "Watch a stale phone meet the rule. The phone edited offline, on top of revision seven. Meanwhile the laptop saved revision eight.",
      "The phone saves: base seven, revision eight.",
      "The rule reads the stored revision. It's eight.",
      { say: "So the write is refused with permission denied. And your sync code catches exactly that error code.", tone: "key" },
      "It fetches the head, and runs a three way merge of the phone's edit and the laptop's edit, against base seven.",
      "Then it saves again: base eight, revision nine. Accepted.",
      "And if both devices changed the same lines, nothing is guessed. The head stands, and the phone's version is kept in History as not kept, with a toast, so nothing is ever lost.",
    ),
  },
  {
    kind: "compare",
    title: "Why the rule, and not a transaction",
    cols: [
      { title: "Client transaction", icon: "🔒", tone: "red", items: ["needs to be online", "IPP edits offline, syncs later"] },
      { title: "Check, then write", icon: "👀", tone: "amber", items: ["two devices both see rev 7", "both pass, both write"] },
      { title: "Rule on the write ✓", icon: "🛡", tone: "green", items: ["check + write: one atomic step", "for every client", "an offline write is judged on arrival"] },
    ],
    footer: "name it: optimistic locking · UPDATE … WHERE version = 7 · git refusing a non-fast-forward push",
    beats: B(
      "Why a rule, and not a Firestore transaction? A client transaction needs to be online. Your app edits offline and syncs later.",
      "Why not check the version in the client, then write? Because two devices can both read revision seven, both pass the check, and both write.",
      { say: "The rule is evaluated with the write, as one atomic step, on Google's servers, for every client. And an offline write is simply judged when it finally arrives.", tone: "key" },
      { say: "Name it in the interview. Optimistic locking, like an update where version equals seven. Or git refusing a non fast forward push.", tone: "key" },
    ),
  },
  check({
    topic: "compare-and-swap",
    q: "The stored head is revision 12. A device saves base 11, rev 12. What do the rules do?",
    say: "The stored head is revision twelve. A device saves with base eleven, and revision twelve. What do the rules do?",
    a: "Refuse it: rev == base + 1 holds, but the base (11) isn't the stored head (12). The device fetches the head and merges.",
    aSay: "Refuse it. Revision equals base plus one holds, but the base, eleven, isn't the stored head, twelve. The edit was built on an old version, so the device fetches the head and merges.",
  }),

  // ------------------------------------------------------------ 10
  sec("10", "The admin SDK and your functions", "Topic ten. The server side. The admin SDK, and why your app needs any server at all."),
  {
    kind: "code",
    title: "api/_lib/admin.mjs",
    lang: "js",
    code: `const account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(account) });   // a trusted admin

export const db = () => getFirestore(app());      // bypasses the rules
export const auth = () => getAuth(app());

export async function verifiedUser(request) {
  const m = /^Bearer (.+)$/.exec(request.headers.get("authorization") || "");
  return m ? auth().verifyIdToken(m[1]).catch(() => null) : null;
}`,
    highlight: [[1, 2], [4, 4], [7, 9]],
    beats: B(
      "Here's the server side, in one file. A service account, a private key kept in Vercel's environment, makes the function a trusted admin.",
      { say: "Its Firestore handle bypasses the rules. That's how the reminder job can read every subscriber, which no browser ever can.", tone: "key" },
      "And verified user reads the bearer token from the request and verifies it. No valid token, no user.",
    ),
  },
  {
    kind: "compare",
    title: "What runs on the server, and why",
    cols: [
      { title: "Secrets", icon: "🔑", tone: "red", items: ["Gmail app password", "clist API key · cron secret"] },
      { title: "Other people's data", icon: "👥", tone: "amber", items: ["subscriber emails", "visit analytics"] },
      { title: "Schedules", icon: "⏰", tone: "blue", items: ["96 daily Vercel crons", "≈ every 15 minutes · GitHub backup"] },
    ],
    footer: "Vercel functions, not Cloud Functions: same repo and deploy, CDN in front, no paid Firebase plan",
    beats: B(
      "Three things run on the server, and each for a reason a browser can't meet. Secrets: the Gmail app password, the clist API key, the cron secret.",
      "Other people's data: subscriber emails, and visit analytics.",
      "Schedules: reminders must run when nobody has the site open. Ninety six daily Vercel crons, about every fifteen minutes, with a GitHub Actions backup.",
      { say: "And if they ask, why Vercel functions and not Cloud Functions? The site was already on Vercel, so the functions deploy with it, sit behind the same CDN, and cron comes free, without a paid Firebase plan. To Firestore, the admin SDK looks the same from either.", tone: "key" },
    ),
  },
  check({
    topic: "the admin SDK",
    q: "The browser can talk to Firestore directly. Why does your app need any server at all?",
    a: "Secrets, other users' data and schedules can never be trusted to a browser.",
    aSay: "Because three things can never be trusted to a browser: secrets, other users' data, and schedules that run when nobody has the site open.",
  }),

  // ------------------------------------------------------------ 11
  sec("11", "Limits and cost", "Topic eleven. The limits and the bill, and what your app does about each."),
  {
    kind: "compare",
    title: "Firestore's limits, and your answers",
    cols: [
      { title: "1 MiB per document", icon: "📏", tone: "blue", items: ["→ notes and keys split", "into their own documents"] },
      { title: "~1 write/s per doc", icon: "✍️", tone: "amber", items: ["sustained (soft limit)", "→ 800 ms debounce"] },
      { title: "Billed per document", icon: "💰", tone: "green", items: ["free: 50K reads, 20K writes", "→ lazy SDK, own docs only"] },
      { title: "Location is forever", icon: "📍", tone: "purple", items: ["chosen at creation", "→ Brikby: pick India on day one"] },
    ],
    footer: "not for: joins, ad-hoc analytics, full-text or vector search → that's why DeepLogLens uses Postgres",
    beats: B(
      "Four limits, and your answer to each. One mebibyte per document: notes and other keys are split into their own documents.",
      "About one sustained write per second to a single document, a soft limit: the eight hundred millisecond debounce turns ten quick ticks into one write.",
      "Billing is per document read, write and delete. The free quota is fifty thousand reads and twenty thousand writes a day. Your app loads the SDK lazily and listens only to the account's own documents, so it sits well inside it.",
      { say: "And the location. A database's region is chosen when it's created, and can never be moved. That's the hook for your second Brikby question: for lender data, pick an Indian region on day one.", tone: "key" },
      { say: "And when not to choose Firestore at all: joins, ad hoc analytics, full text or vector search. That's exactly why DeepLogLens uses Postgres. Say that, and you sound like someone who chooses tools, not someone who only knows one.", tone: "key" },
    ),
  },
  check({
    topic: "limits and cost",
    q: "When would you not choose Firestore?",
    a: "When the work is relational or analytical: joins, ad-hoc reports, full-text or vector search, multi-row transactions at volume. Then Postgres (or BigQuery for analytics).",
    aSay: "When the work is relational or analytical. Joins, ad hoc reports, full text or vector search, multi row transactions at volume. Then Postgres, or BigQuery for analytics. That's why DeepLogLens uses Postgres.",
  }),

  // ------------------------------------------------------------ 12
  sec("12", "The answers to give", "Topic twelve. The answers, ready to say. Four questions they're likely to ask."),
  {
    kind: "sayit",
    q: "\"How does Firestore sync work in your app?\"",
    lines: [
      "\"Every edit is written to a local store first, synchronously, and recorded in a pending journal.",
      "After 800 ms of quiet, only the changed entries go to Firestore with mergeFields, with their edit times.",
      "Each device keeps three snapshot listeners; it merges per entry, newer edit wins,",
      "and it never pushes before it has heard from the server.",
      "Firestore's IndexedDB cache sits underneath for offline reads and queued writes.\"",
    ],
    beats: B(
      "How does Firestore sync work in your app?",
      "Every edit is written to a local store first, synchronously, and recorded in a pending journal.",
      "After eight hundred milliseconds of quiet, only the changed entries go to Firestore, with merge fields, and their edit times.",
      "Each device keeps three snapshot listeners. It merges per entry, and the newer edit wins.",
      "And it never pushes before it has heard from the server.",
      "Firestore's own IndexedDB cache sits underneath, for offline reads and queued writes.",
    ),
  },
  {
    kind: "sayit",
    q: "\"How do your security rules work?\"",
    lines: [
      "\"Each user can only touch documents under their own uid; everything else is denied,",
      "which makes subscribers and caches server-only.",
      "History is create-and-read only, so it's append-only by construction.",
      "Notes are fast-forward only: a save names its base revision, and the rule compares it with the stored one in the same step as the write.\"",
    ],
    beats: B(
      "How do your security rules work?",
      "Each user can only touch documents under their own uid. Everything else is denied.",
      "Which makes subscribers and caches server only.",
      "History is create and read only, so it's append only by construction.",
      "And notes are fast forward only. A save names its base revision, and the rule compares it with the stored revision in the same step as the write. So a stale device is refused, and merges instead.",
    ),
  },
  {
    kind: "drill",
    items: [
      { q: "How does your server trust the browser?", a: "It verifies the Firebase ID token with the admin SDK and takes uid and email from it, never the body." },
      { q: "What would you add?", a: "App Check · checkRevoked on sensitive endpoints · scheduled Firestore exports for backup." },
      { q: "ID token lifetime?", a: "One hour; the SDK refreshes it with the refresh token." },
      { q: "Does the admin SDK obey the rules?", a: "No: it bypasses them; it's trusted server code." },
    ],
    beats: B(
      { say: "Rapid fire. How does your server trust the browser?", hold: 3 },
      "It verifies the Firebase ID token with the admin SDK, and takes the uid and the email from the token, never from the body.",
      { say: "What would you add?", hold: 3 },
      "App Check, so only your real app can call Firestore and the functions. Check revoked on sensitive endpoints. And scheduled Firestore exports, for backups.",
      { say: "How long does an ID token live?", hold: 3 },
      "One hour. The SDK refreshes it with the refresh token.",
      { say: "Does the admin SDK obey the security rules?", hold: 3 },
      "No. It bypasses them. It's trusted server code, which is exactly why it only runs on the server.",
    ),
  },
  check({
    topic: "the answers",
    q: "In two sentences: is your note sync just last-writer-wins with extra steps?",
    a: "No: every save names its base revision, and the rules refuse it unless that base is still the head, so a stale device can't overwrite anything. A refused save is merged line by line, and same-line conflicts are kept in an append-only history.",
    aSay: "No. Every save names its base revision, and the rules refuse it unless that base is still the head, so a stale device can't overwrite anything. A refused save is merged line by line, and if both changed the same lines, nothing is lost: the other version is kept in an append only history.",
  }),
];
