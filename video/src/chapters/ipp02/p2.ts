import type { Scene } from "../../lib/types.ts";
import { B, arch, sec } from "../ll01/h.ts";
import { check } from "./k.ts";
import { SYNC, SYNC_STEPS } from "./boards.ts";

// Part 2: writes and transactions, listeners, the offline cache and the sync
// board, security rules.
export const p2: Scene[] = [
  // ------------------------------------------------------------ 5
  sec("5", "Writing: merge, batches, transactions", "Topic five. Writing. Five ways to write, and which ones your code uses."),
  {
    kind: "compare",
    title: "The write calls",
    cols: [
      { title: "setDoc", icon: "📝", tone: "blue", items: ["replace the document", "{ merge: true }: merge in", "{ mergeFields }: only these fields"] },
      { title: "Field helpers", icon: "🧩", tone: "green", items: ["deleteField(): remove one field", "serverTimestamp(): server's clock"] },
      { title: "Batched write", icon: "📦", tone: "amber", items: ["several writes", "all or nothing · no reads"] },
      { title: "Transaction", icon: "🔒", tone: "purple", items: ["read → decide → write", "client: optimistic, retried, online only", "server: pessimistic locks"] },
    ],
    footer: "IPP: mergeFields per entry in the browser · a transaction on the server for reminders",
    beats: B(
      "Set doc replaces a whole document. With merge true, it merges into what's there. And with merge fields, it writes only the fields you list. Remember that one.",
      "Two field helpers. Delete field removes a single field. Server timestamp uses the server's clock instead of the device's.",
      "A batched write applies several writes, all or nothing. It can't read.",
      { say: "And a transaction reads, decides, and writes, all or nothing. On the client SDK it's optimistic: if a document it read changes underneath, it retries, and it only works online. On the server SDK it takes pessimistic locks on what it reads.", tone: "key" },
      "Your app uses merge fields in the browser, and a transaction on the server. Let's see both.",
    ),
  },
  {
    kind: "code",
    title: "Two writes from your code",
    lang: "js",
    code: `// browser: push only the entries this device changed (cloudSync.js)
await setDoc(userDocRef(uid), data, { mergeFields: [
  new FieldPath("DSAPrepCompleted", "two-sum"),
  new FieldPath("_meta", "DSAPrepCompleted", "two-sum"), // edit time
]});

// server: claim before send (api/contest-reminders.mjs)
db.runTransaction(async (tx) => {
  const sentTo = (await tx.get(ref)).get("sentTo") || {};
  const fresh = people.filter((p) => !sentTo[p.id]);
  tx.set(ref, { sentTo: claims(fresh) }, { merge: true });
  return fresh;                                       // only these get email
});`,
    highlight: [[2, 5], [8, 13]],
    beats: B(
      { say: "In the browser, a push writes only the entries this device changed, with merge fields. One field path for the entry, two sum, and one for its edit time. So a device can never overwrite entries it didn't touch. A deleted entry is written as delete field, plus a tombstone time.", tone: "key" },
      { say: "On the server, the reminder job claims before it sends. A transaction reads who has already been sent this reminder, keeps only the people who haven't, writes them in, and only those people get an email. If a send fails, the claim is released. Two overlapping runs can never both claim the same person. Never a duplicate, at worst one skipped email.", tone: "key" },
    ),
  },
  check({
    topic: "writes",
    q: "Why mergeFields instead of writing the whole map of ticks?",
    a: "A whole-map write from a stale device would overwrite entries it never touched; mergeFields writes only the entries this device changed.",
    aSay: "Because a whole map write from a stale device would overwrite entries it never touched. Merge fields writes only the entries this device actually changed.",
  }),

  // ------------------------------------------------------------ 6
  sec("6", "Real-time listeners", "Topic six. Real time listeners. The feature Brikby uses for job status, and you use for sync."),
  {
    kind: "compare",
    title: "onSnapshot, and the two flags that matter",
    cols: [
      { title: "onSnapshot", icon: "📡", tone: "blue", items: ["current state first", "then a snapshot per change", "from any device"] },
      { title: "Cache", icon: "💾", tone: "amber", items: ["fromCache: true", "from the local cache", "the server hasn't confirmed it"] },
      { title: "Pending", icon: "⏳", tone: "green", items: ["hasPendingWrites: true", "includes my own write", "not yet acknowledged"] },
      { title: "Billing", icon: "💰", tone: "purple", items: ["first snapshot: a read per doc", "then a read per changed doc"] },
    ],
    footer: "latency compensation: your own write fires your listener at once, marked pending",
    beats: B(
      "On snapshot opens a stream. You get the current state first, then a new snapshot every time a document changes, from any device.",
      { say: "Every snapshot carries metadata. From cache, true, means this came from the local cache, and the server hasn't confirmed it.", term: { word: "fromCache", meaning: "the snapshot came from the local cache, not yet confirmed by the server" } },
      "Has pending writes, true, means it includes this device's own write, which the server hasn't acknowledged yet.",
      "Billing: the first snapshot costs one read per document; after that, one read per changed document.",
      { say: "And latency compensation. Your own write fires your own listener immediately, marked pending, before the server even has it. That's why the UI feels instant.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "Your three listeners (cloudSync.js → listen)",
    firstItemStep: 1,
    items: [
      { icon: "1️⃣", text: "userProgress/{uid}, data/, notes/", sub: "three listeners per signed-in account, includeMetadataChanges: true" },
      { icon: "🧩", text: "Nothing is decided until all three have answered", sub: "a note is never judged against the main document's older copy alone" },
      { icon: "🛑", text: "Nothing is pushed before a snapshot from the server", sub: "\"a cached doesn't-exist proves nothing\"" },
      { icon: "🏷", text: "Brikby's job status is the same mechanism", sub: "the worker writes a field; every open tab is told" },
    ],
    beats: B(
      "Now your code. The function called listen.",
      "Three listeners per signed in account: the main document, the data subcollection, and the notes subcollection. All with include metadata changes, so you hear when a write is confirmed.",
      "Nothing is decided until all three have answered. A note must never be judged against the main document's older copy of it alone.",
      { say: "And nothing is pushed before a snapshot that came from the server. Your own comment says it best: a cached doesn't exist proves nothing. A new device with an empty cache must never mistake it for an empty account.", tone: "key" },
      "And Brikby's job status is the same mechanism. The worker writes a stage field, and every open tab is told. You can say: I use the same listener pattern for cross device sync.",
    ),
  },
  check({
    topic: "listeners",
    q: "Why wait for a snapshot that is not fromCache before pushing anything?",
    say: "Why wait for a snapshot that is not from cache, before pushing anything?",
    a: "The cache may be days old; deciding from it could push stale data over newer server data. Merge the server's copy first.",
    aSay: "Because the cache may be days old. Deciding from it could push stale data over newer data on the server. So the server's copy is merged first, and only then does anything get pushed.",
  }),

  // ------------------------------------------------------------ 7
  sec("7", "The offline cache, and your own store", "Topic seven. Firestore's offline cache, and why your app keeps its own store on top of it."),
  {
    kind: "code",
    title: "Firestore, set up for offline (firestoreClient.js)",
    lang: "js",
    code: `export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// firestore.js: the SDK is its own chunk, loaded on demand
export const loadFirestore = () => (loading ??= import("./firestoreClient.js"));`,
    highlight: [[2, 2], [3, 3], [7, 8]],
    beats: B(
      { say: "Persistent local cache. Firestore keeps its own copy in IndexedDB. Reads work offline. Writes are applied locally at once, queued, and reach the server when the network returns, even after a reload. And a write's promise resolves only when the server acknowledges it. If the rules refuse it, the SDK rolls the local change back, and the promise rejects with permission denied.", tone: "key" },
      "The multiple tab manager lets several open tabs share that one cache safely.",
      "And the SDK is loaded on demand, in a chunk of its own. A guest never downloads it, and a signed in visit renders from the local store while it loads.",
    ),
  },
  arch(
    SYNC,
    SYNC_STEPS,
    B(
      "Here's one tick, from the click to your other device. The page, the local store, the pending journal, the sync engine, Firestore's SDK with its cache, the Firestore server, and the other device.",
      "Instant. The click writes the local store, synchronously. That's all the click waits for.",
      "Owed to the cloud. The store's event puts the entry and its edit time into the pending journal, also in local storage, before anything leaves the device. So a crash or a refresh can't lose it.",
      { say: "Batched. After eight hundred milliseconds of quiet, the engine writes only the changed entries, with merge fields, plus their edit times. Ten quick ticks become one write.", tone: "key" },
      "Queued if offline. Firestore's own cache applies the write and queues it, and it reaches the server when the network returns.",
      "Everywhere. The other device's listeners deliver it, and it merges per entry. The newer edit wins, and deletes are kept as tombstones so an old copy can't bring them back.",
    ),
    "One tick, from click to the other device",
  ),
  {
    kind: "compare",
    title: "Why your own store on top of Firestore's cache",
    cols: [
      { title: "Firestore cache alone", icon: "💾", tone: "amber", items: ["async reads", "last write to a field wins", "only writes already handed over"] },
      { title: "Store + journal", icon: "📒", tone: "green", items: ["synchronous reads: instant UI", "per-entry newer-wins, tombstones", "covers debounce, crash, refresh"] },
    ],
    footer: "each layer does a job the others can't",
    beats: B(
      "So why keep your own store, when Firestore already has a cache? Firestore's cache alone gives you asynchronous reads, last write to a field wins, and it only holds writes that were already handed to it.",
      "Your store and journal give synchronous reads for an instant UI, per entry newer wins with tombstones and a five minute clock skew guard, and they cover the debounce window, a crash, and a refresh.",
      { say: "The one line answer: each layer does a job the others can't.", tone: "key" },
    ),
  },
  check({
    topic: "the offline cache",
    q: "Firestore already queues offline writes. Why does your app keep a pending journal?",
    a: "The queue only holds writes already handed to the SDK and can't say what changed and when; the journal records that for per-entry merging, and covers the debounce, crashes and refreshes.",
    aSay: "Because Firestore's queue only holds writes already handed to it, and it can't tell you what changed and when. The journal records exactly that, which per entry merging needs, and it covers the debounce window, a crash, and a refresh.",
  }),

  // ------------------------------------------------------------ 8
  sec("8", "Security rules", "Topic eight. Security rules. Your server side authorization, and the part Brikby will most likely probe."),
  {
    kind: "compare",
    title: "What a rule can see",
    cols: [
      { title: "Who asks", icon: "🪪", tone: "blue", items: ["request.auth", "uid, claims · or null"] },
      { title: "Stored now", icon: "📄", tone: "green", items: ["resource.data", "the document as it is"] },
      { title: "After the write", icon: "📝", tone: "amber", items: ["request.resource.data", "diff().affectedKeys()"] },
      { title: "get() / exists()", icon: "🔗", tone: "purple", items: ["read another doc in a rule", "billed as a read · max 10"] },
    ],
    footer: "default deny · rules are not filters · the admin SDK bypasses them",
    beats: B(
      "What a rule can see. Request dot auth is the verified token: the user id and its claims, or null for a guest.",
      "Resource dot data is the document as it's stored now.",
      "Request dot resource dot data is the document as it would be after this write. And diff, affected keys, tells you exactly which fields the write changes.",
      "Get and exists read another document inside a rule. Each one is billed as a read, and there's a limit of ten per request.",
      { say: "Three rules about rules. Default deny: anything not matched is refused. Rules are not filters: a query that might return a document you can't read is refused whole. And the admin SDK bypasses rules entirely: it's trusted server code.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "Your rules, in plain words",
    firstItemStep: 1,
    items: [
      { icon: "👤", text: "signedInAs(uid): only userProgress/{your uid}", sub: "nobody reads or writes another account" },
      { icon: "⛔", text: "/{document=**}: allow read, write: if false", sub: "subscribers, reminders, visits, caches: server-only" },
      { icon: "📜", text: "history revisions: create and read only", sub: "append-only, enforced by Google, not by the app" },
      { icon: "📏", text: "noteAssets: a string under 900,000 characters", sub: "an oversized write is never attempted" },
      { icon: "⏩", text: "notes: fast-forward only", sub: "next topic: compare-and-swap" },
    ],
    beats: B(
      "Your rules, in plain words.",
      "Signed in as uid. You can only touch user progress slash your own uid, and below.",
      { say: "A catch all at the end: every other path, allow read and write, if false. That single line is what makes subscribers, reminders, visits and caches server only.", tone: "key" },
      "History revisions: create and read, only. There's no update and no delete, so history is append only, and Google enforces it, not your app.",
      "Note screenshots must be a string under nine hundred thousand characters, so an oversized write is never even attempted.",
      "And notes are fast forward only. That's the next topic.",
    ),
  },
  check({
    topic: "security rules",
    q: "A buggy client tries to delete a history revision. What happens?",
    a: "Google refuses it: the rules allow only create and read on revisions, so no client can rewrite history.",
    aSay: "Google refuses it. The rules allow only create and read on revisions. There's no delete, so no client, buggy or malicious, can rewrite history.",
  }),
];
