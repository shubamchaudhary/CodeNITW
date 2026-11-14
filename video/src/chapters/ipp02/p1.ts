import type { Scene } from "../../lib/types.ts";
import { B, arch, sec } from "../ll01/h.ts";
import { check } from "./k.ts";
import { FIREBASE, FIREBASE_STEPS } from "./boards.ts";

// Part 1: what Firebase is, Auth and the ID token, the data model, reads.
export const p1: Scene[] = [
  {
    kind: "title",
    eyebrow: "Projects · InterviewPlanPrep",
    title: "Firebase and Firestore, and how InterviewPlanPrep uses them",
    subtitle: "From zero, then your own code, then the answers to give",
    beats: B(
      "Firebase and Firestore, from zero. Then exactly how InterviewPlanPrep uses each piece, in your own code. Brikby runs on the same family: Firebase Auth, Firestore listeners, and functions behind an ID token. So expect them to ask how your sync works, and how your security rules work. By the end, you'll answer both without hesitating. Slowly, one idea at a time, with a check after every topic.",
    ),
  },

  // ------------------------------------------------------------ 1
  sec("1", "What Firebase is", "Topic one. What Firebase actually is, and the one trade it makes."),
  {
    kind: "big",
    tone: "idea",
    lead: "The idea that changes everything",
    text: "The browser talks to Google's database directly. There is no API server of yours in between.",
    after: "so who stops user A reading user B's data? the security rules",
    beats: B(
      "Firebase is Google's backend as a service, built on Google Cloud.",
      { say: "And here's the idea that changes everything. The browser talks to Google's database directly. There is no API server of yours in between the React app and the data.", tone: "key" },
      "Which raises the obvious question. If the browser talks to the database directly, who stops user A reading user B's data? The answer is the security rules. Hold that thought until topic eight.",
    ),
  },
  {
    kind: "compare",
    title: "The products, and which ones you use",
    cols: [
      { title: "You use", icon: "✅", tone: "green", items: ["Firebase Auth: sign-in, ID tokens", "Cloud Firestore: documents, listeners, offline cache"] },
      { title: "You don't", icon: "➖", tone: "amber", items: ["Hosting, Cloud Functions → Vercel", "Cloud Storage → paid plan, so data URLs"] },
      { title: "Worth knowing", icon: "💡", tone: "blue", items: ["Firestore IS Google Cloud Firestore", "App Check: proves calls come from your app"] },
    ],
    footer: "the trade: no backend to run; the rules become your server-side authorization",
    beats: B(
      "Firebase is a set of products. You use two of them. Firebase Auth, for sign in and ID tokens. And Cloud Firestore, a document database with real time listeners and an offline cache.",
      "You don't use Firebase Hosting or Cloud Functions: the site and its functions live on Vercel. And you don't use Cloud Storage, because it needs the paid plan, so note screenshots are stored as compressed data URLs in Firestore itself.",
      "Two things worth knowing. Firestore is Google Cloud Firestore: the same database you'd see in the Google Cloud console. And App Check, a way to prove requests come from your real app. You don't use it yet. That's an honest gap, and we'll turn it into an answer at the end.",
      { say: "So, the trade, in one line. No backend to run. In exchange, the security rules become your server side authorization.", tone: "key" },
    ),
  },
  arch(
    FIREBASE,
    FIREBASE_STEPS,
    B(
      "Here's the whole picture on one board. Your React app on the left. Inside Google: Firebase Auth, the security rules, and Firestore. Below, your Vercel functions, and the secrets and schedules only they can touch.",
      "Sign in. The app signs in with Firebase Auth and gets an ID token. A JSON web token signed by Google, valid for an hour, refreshed by the SDK on its own.",
      { say: "Straight to the database. The Firestore SDK sends reads and writes to Google directly, with the token attached. There's no API server of yours in between.", tone: "key" },
      "The rules decide. Security rules run on Google's servers, for every single request. They see who's asking, what's stored, and what the write would change.",
      "Pushed back. Listeners stream every change to the documents the app watches, from any device, in real time. No polling.",
      "And the server, only where it's needed. Your functions verify the ID token, and use the admin SDK, which bypasses the rules, for three things a browser can never be trusted with: secrets, other people's data, and schedules.",
    ),
    "Firebase: who talks to whom",
  ),
  check({
    topic: "what Firebase is",
    q: "If the browser talks to Firestore directly, what is your server-side authorization?",
    options: ["The React code", "The security rules, run by Google on every request", "The Vercel functions", "HTTPS"],
    answer: 1,
    a: "The security rules: Google evaluates them on its servers for every read and write, so they bind every client.",
    aSay: "B. The security rules. Google evaluates them on its own servers, for every read and every write, so they bind every client, well behaved or not.",
  }),

  // ------------------------------------------------------------ 2
  sec("2", "Firebase Auth and the ID token", "Topic two. Firebase Auth, and the ID token, which is the thing every other piece trusts."),
  {
    kind: "compare",
    title: "Two tokens, two jobs",
    cols: [
      { title: "ID token", icon: "🪪", tone: "blue", items: ["a JWT signed by Google (RS256)", "valid 1 hour", "uid · email · email_verified", "aud = project · iss = securetoken"] },
      { title: "Refresh token", icon: "🔄", tone: "green", items: ["long-lived", "swapped for a new ID token", "the SDK does it; you never touch it"] },
      { title: "Session", icon: "💾", tone: "amber", items: ["kept in IndexedDB", "survives a reload", "onAuthStateChanged: who is signed in"] },
    ],
    footer: "everything downstream trusts the ID token, because only Google can sign it",
    beats: B(
      "Firebase Auth gives you two tokens with two jobs. The ID token is a JSON web token, signed by Google with RS256, valid for one hour. Inside: the user id, the email, whether the email is verified, the audience, which is your project id, and the issuer, secure token dot google dot com.",
      { say: "The refresh token is long lived. The SDK swaps it for a fresh ID token before the old one expires. You never touch it.", term: { word: "ID token", meaning: "a Google-signed JWT proving who the user is, valid 1 hour" } },
      "And the session is kept in IndexedDB, so a reload stays signed in. The function on auth state changed tells the app, at load and on every sign in or sign out, who is signed in.",
      { say: "The key idea: everything downstream trusts the ID token, because only Google can sign it.", tone: "key" },
    ),
  },
  {
    kind: "seq",
    title: "How a Vercel function trusts the browser",
    actors: [
      { id: "b", name: "Browser", icon: "🖥" },
      { id: "a", name: "Firebase Auth", icon: "🔐" },
      { id: "f", name: "Vercel function", icon: "⚙️" },
    ],
    msgs: [
      { from: "b", to: "a", label: "sign in (password or Google)", step: 1 },
      { from: "a", to: "b", label: "ID token + refresh token", step: 2, dash: true },
      { from: "b", to: "f", label: "Authorization: Bearer <ID token>", step: 3, tone: "blue" },
      { from: "f", to: "a", label: "verifyIdToken: Google's keys · aud · iss · exp", step: 4, tone: "green" },
    ],
    note: { step: 5, text: "uid and email come from the verified token, never from the body", tone: "green" },
    beats: B(
      "Here's how one of your Vercel functions trusts the browser.",
      "The browser signs in, with email and password, or the Google popup.",
      "Firebase Auth returns the ID token and the refresh token.",
      "When the page calls a function, say, to turn on contest reminders, it calls get ID token, and sends it as a bearer token.",
      { say: "The function calls verify ID token, with the admin SDK. It checks Google's signature against Google's public keys, the audience, the issuer and the expiry. Note one thing: it does not check revocation, unless you pass check revoked, which costs an extra call.", tone: "key" },
      { say: "And the rule you must say out loud. The user id and the email come from the verified token. Never from the request body. That's why nobody can subscribe someone else's email to your reminders.", tone: "key" },
    ),
  },
  check({
    topic: "Auth",
    q: "Why can't someone subscribe another person's email to your contest reminders?",
    a: "The function takes the email from the verified ID token, which only Google can sign, never from the request body.",
    aSay: "Because the function takes the email from the verified ID token, which only Google can sign. It never reads the email from the request body.",
  }),

  // ------------------------------------------------------------ 3
  sec("3", "Documents and collections", "Topic three. The data model. Documents, collections, and why there are no joins."),
  {
    kind: "bullets",
    title: "The model in four rules",
    firstItemStep: 1,
    items: [
      { icon: "📄", text: "A document is a map of fields", sub: "strings, numbers, timestamps, maps, arrays · at most 1 MiB" },
      { icon: "📁", text: "Collections hold documents; documents own subcollections", sub: "paths alternate: collection / doc / collection / doc" },
      { icon: "🚫", text: "No joins", sub: "shape data around the screens that read it; duplicate when you must" },
      { icon: "💰", text: "A document read is the unit of cost and of real-time updates", sub: "design around how many documents a screen touches" },
    ],
    beats: B(
      "Four rules, and you have the model.",
      "A document is a map of fields: strings, numbers, timestamps, maps, arrays. At most one mebibyte.",
      "Collections hold documents, and a document can own subcollections. So paths alternate: collection, document, collection, document.",
      "There are no joins. You shape data around the screens that read it, and you duplicate when you must.",
      { say: "And a document read is the unit of cost, and the unit of real time updates. So you design around how many documents each screen touches.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "One account in InterviewPlanPrep",
    lang: "text",
    code: `userProgress/{uid}                      DSA ticks, plans, _meta, _rev
  data/{key}                            one doc per other kind of progress
  notes/{key}~{id}                      one doc per note: value, rev, base
  history/{note}/revisions/{time-dev}   every saved version, append-only
  noteAssets/{id}                       a screenshot as a data URL

contestSubscribers/ · contestReminders/ · visits/ · appCache/
                                        server-only: the browser is denied`,
    highlight: [[1, 1], [2, 3], [4, 4], [7, 8]],
    beats: B(
      "Here's one account in InterviewPlanPrep. The main document, user progress slash your uid, holds DSA ticks, planned days, the edit times, and the note revisions.",
      { say: "Under it, a data subcollection with one document per other kind of progress, and a notes subcollection with one document per note. Why split? The one mebibyte limit. One heavy note taker would fill the main document. And a document per note gives each note its own revision number.", tone: "key" },
      "History holds every saved version of every note. Append only, and we'll see how the rules enforce that.",
      "And four collections at the top level that only the server can touch: subscribers, sent reminders, visits, and caches. The browser is denied all of them.",
    ),
  },
  check({
    topic: "the data model",
    q: "Why are notes split into their own documents?",
    a: "The 1 MiB document limit, and so each note can carry its own revision number for compare-and-swap.",
    aSay: "Two reasons. The one mebibyte document limit: a heavy note taker would fill the main document. And so each note has its own revision number, which the compare and swap in the rules depends on.",
  }),

  // ------------------------------------------------------------ 4
  sec("4", "Reading: queries and indexes", "Topic four. Reading. One document, or a query, and why every query is served by an index."),
  {
    kind: "compare",
    title: "How Firestore reads",
    cols: [
      { title: "getDoc", icon: "📄", tone: "blue", items: ["one document", "one read"] },
      { title: "Queries", icon: "🔎", tone: "green", items: ["where · orderBy · limit · cursors", "every match = one read"] },
      { title: "Indexes", icon: "🗂", tone: "amber", items: ["single-field: automatic", "composite: declared", "cost ∝ results, not collection size"] },
      { title: "count()", icon: "#️⃣", tone: "purple", items: ["an aggregation query", "counts without downloading"] },
    ],
    footer: "IPP's browser never queries; it listens to the account's own documents. The server queries.",
    beats: B(
      "Reading. Get doc reads one document, and costs one read.",
      "A query filters with where, sorts with order by, and pages with limit and cursors. Every matching document costs one read.",
      { say: "And every query is served by an index. Single field indexes are automatic; queries over several fields need a composite index you declare. That's why a Firestore query stays fast as a collection grows: it costs in proportion to the results, not the collection.", tone: "key" },
      "And count is an aggregation query. It counts without downloading the documents.",
      "In your app, the browser never runs a query. It listens to the account's own documents. The server side does query: reminders select confirmed subscribers, and the job radar pages openings by time with a cursor, and uses count for totals.",
    ),
  },
  check({
    topic: "reads",
    q: "Why does a Firestore query stay fast as the collection grows?",
    a: "Every query is answered from an index, so cost and latency scale with the results returned, not the documents stored.",
    aSay: "Because every query is answered from an index. Its cost and its latency scale with the number of results returned, not with the number of documents stored.",
  }),
];
