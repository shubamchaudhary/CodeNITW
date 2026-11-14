import type { Step } from "../ll01/diagrams.ts";

// Boards for IPP-02, drawn with LL-01's llarch scene (view units).

type N = { id: string; x: number; y: number; w: number; h?: number; t: string; s?: string; tone?: string };
type E = { id: string; from?: string; to?: string; fs?: "l" | "r" | "t" | "b"; ts?: "l" | "r" | "t" | "b"; fo?: number; tof?: number; via?: [number, number][]; l?: string; lx?: number; ly?: number; la?: "start" | "middle" | "end" };
type Board = { view: [number, number]; nodes: N[]; edges: E[]; groups?: { x: number; y: number; w: number; h: number; t: string; nodes?: string[] }[] };

// Who talks to whom: the browser goes to Google directly; the rules guard it.
export const FIREBASE: Board = {
  view: [1500, 700],
  groups: [{ x: 500, y: 20, w: 560, h: 420, t: "Google (Firebase)", nodes: ["auth", "rules", "fs"] }],
  nodes: [
    { id: "app", x: 40, y: 250, w: 300, t: "React app", s: "Firebase web SDK" },
    { id: "auth", x: 560, y: 70, w: 440, t: "Firebase Auth", s: "ID token · refresh token" },
    { id: "rules", x: 560, y: 210, w: 440, t: "Security rules", s: "run on every request", tone: "teal" },
    { id: "fs", x: 560, y: 340, w: 440, t: "Cloud Firestore", s: "documents · listeners" },
    { id: "fn", x: 560, y: 560, w: 440, t: "Vercel functions", s: "Node.js · admin SDK" },
    { id: "secret", x: 1140, y: 560, w: 320, t: "Secrets & schedules", s: "Gmail · clist · cron" },
  ],
  edges: [
    { id: "a-auth", from: "app", to: "auth", fs: "t", ts: "l", via: [[190, 112]], l: "sign in", lx: 200, ly: 100, la: "start" },
    { id: "a-rules", from: "app", to: "rules", fs: "r", ts: "l", fo: -20, via: [[450, 272], [450, 252]], l: "read / write + token", lx: 200, ly: 238, la: "start" },
    { id: "rules-fs", from: "rules", to: "fs", fs: "b", ts: "t" },
    { id: "fs-a", from: "fs", to: "app", fs: "l", ts: "r", tof: 30, via: [[450, 382], [450, 322]], l: "snapshots", lx: 380, ly: 372, la: "start" },
    { id: "a-fn", from: "app", to: "fn", fs: "b", ts: "l", via: [[190, 602]], l: "Bearer ID token", lx: 200, ly: 470, la: "start" },
    { id: "fn-fs", from: "fn", to: "fs", fs: "t", ts: "b", fo: 120, tof: 120, l: "bypasses rules", lx: 900, ly: 500, la: "start" },
    { id: "fn-s", from: "fn", to: "secret" },
  ],
};

export const FIREBASE_STEPS: Step[] = [
  { all: true },
  { t: "Sign in", b: "The app signs in with Firebase Auth and gets an ID token: a Google-signed JWT, valid an hour, refreshed by the SDK.", m: "email/password or Google popup", nodes: ["app", "auth"], edges: ["a-auth"] },
  { t: "Straight to the database", b: "The SDK sends reads and writes to Firestore directly, with the token attached. No API server of yours in between.", m: "no backend to write", nodes: ["app", "rules", "fs"], edges: ["a-rules", "rules-fs"] },
  { t: "The rules decide", b: "Security rules run on Google's servers for every request: who is asking, what is stored, what the write would change.", m: "your server-side authorization", nodes: ["rules"] },
  { t: "Pushed back", b: "Listeners stream every change to the documents the app watches, from any device, in real time.", m: "no polling", nodes: ["fs", "app"], edges: ["fs-a"] },
  { t: "The server, only where needed", b: "Functions verify the ID token and use the admin SDK, which bypasses the rules, for secrets, other people's data and schedules.", m: "reminders, contests, analytics", nodes: ["app", "fn", "fs", "secret"], edges: ["a-fn", "fn-fs", "fn-s"] },
];

// One tick, from click to the other device.
export const SYNC: Board = {
  view: [1500, 720],
  nodes: [
    { id: "ui", x: 40, y: 40, w: 260, t: "Page", s: "tick two-sum" },
    { id: "store", x: 400, y: 40, w: 300, t: "Local store", s: "localStorage · sync" },
    { id: "jr", x: 800, y: 40, w: 300, t: "Pending journal", s: "{ key: { id: editedAt } }" },
    { id: "eng", x: 800, y: 300, w: 300, t: "Sync engine", s: "800 ms debounce · backoff", tone: "teal" },
    { id: "cache", x: 400, y: 300, w: 270, t: "Firestore SDK", s: "IndexedDB cache · queue" },
    { id: "srv", x: 400, y: 570, w: 300, t: "Firestore", s: "userProgress/{uid}" },
    { id: "other", x: 1180, y: 570, w: 280, t: "Other device", s: "3 listeners" },
  ],
  edges: [
    { id: "u-s", from: "ui", to: "store", l: "saveJSON", lx: 350, ly: 30 },
    { id: "s-j", from: "store", to: "jr", l: "event", lx: 750, ly: 30 },
    { id: "j-e", from: "jr", to: "eng", fs: "b", ts: "t" },
    { id: "e-c", from: "eng", to: "cache", l: "mergeFields", lx: 735, ly: 328 },
    { id: "c-s", from: "cache", to: "srv", fs: "b", ts: "t", tof: -15, l: "when online", lx: 545, ly: 470, la: "start" },
    { id: "s-o", from: "srv", to: "other", l: "snapshot", lx: 940, ly: 600 },
  ],
};

export const SYNC_STEPS: Step[] = [
  { all: true },
  { t: "Instant", b: "The click writes the local store synchronously. That is all the click waits for: the tick is on screen and on disk in the same frame.", m: "nothing waits on the network", nodes: ["ui", "store"], edges: ["u-s"] },
  { t: "Owed to the cloud", b: "The store's event puts the entry and its edit time in the pending journal, also in localStorage, before anything leaves the device.", m: "survives a crash or a refresh", nodes: ["store", "jr"], edges: ["s-j"] },
  { t: "Batched", b: "After 800 ms of quiet the engine writes only the changed entries, with setDoc and mergeFields, plus their edit times.", m: "ten quick ticks, one write", nodes: ["jr", "eng", "cache"], edges: ["j-e", "e-c"] },
  { t: "Queued if offline", b: "Firestore's own cache applies the write locally and queues it; it reaches the server when the network returns.", m: "the promise resolves on the server's ack", nodes: ["cache", "srv"], edges: ["c-s"] },
  { t: "Everywhere", b: "The other device's listeners deliver the change; it merges per entry, newer edit wins, deletes kept as tombstones.", m: "per entry, not per document", nodes: ["srv", "other"], edges: ["s-o"] },
];
