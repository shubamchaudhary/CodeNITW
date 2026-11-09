import type { Scene } from "../../lib/types.ts";
import { B, check, sec, shot } from "./h.ts";

// Part 2: the React shell (routes, lazy chunks, a store without Redux, guests)
// and the offline-first data layer behind the DSA tracker.
export const p2: Scene[] = [
  // ------------------------------------------------------------ 3
  sec("3", "The React shell: routes, chunks, one small store", "Topic three. The React shell. How pages load, and where their data lives."),
  {
    kind: "bullets",
    title: "The routes a student uses",
    items: [
      { icon: "🗓", text: "/planning", sub: "the home page: \"/\" redirects here" },
      { icon: "☕", text: "/core-stack and /notes/corestack/:topic", sub: "the topic list, then one full page per topic's notes" },
      { icon: "🧮", text: "/dsa-prep · /contests · /job-tracker", sub: "the tracker, the contest list, the pipeline board" },
      { icon: "🔑", text: "/sign-in · /sign-up · /forgot-password", sub: "one form component for all three" },
      { icon: "↩", text: "anything else → /core-stack", sub: "an unknown URL never shows a blank page" },
    ],
    beats: B(
      "React Router six, on the client. The planner is the home page: the root path redirects to slash planning.",
      "Core Stack is a topic list, and every topic has its own full page for its notes, under slash notes, slash core stack, slash the topic.",
      "Then the DSA tracker, the contests page, and the job tracker's pipeline board.",
      "Sign in, sign up and forgot password are three routes over one form component, with errors shown inline, next to the field that's wrong.",
      "And any unknown URL lands on Core Stack, so a student never sees a blank page.",
    ),
  },
  {
    kind: "code",
    title: "Every page is its own chunk, and can be preloaded",
    lang: "js",
    code: `function lazyPage(factory) {
  let Loaded = null;
  let pending = null;
  const preload = () =>
    (pending ||= factory().then((m) => {
      Loaded = m.default;
      return m;
    }));
  const Lazy = lazy(preload);
  const Page = (props) => {
    const [Comp] = useState(() => Loaded || Lazy);
    return createElement(Comp, props);
  };
  Page.preload = preload;
  return Page;
}

export const Planning = lazyPage(() => import("./pages/Planning/Planning"));`,
    highlight: [[18, 18], [4, 8], [9, 9], [10, 13], [14, 15]],
    beats: B(
      "Every page is a dynamic import, so Vite's production build, which is Rollup, splits it into its own chunk. Opening the planner downloads the planner, not the notes page's markdown renderer.",
      "The wrapper keeps one promise per page. Call preload twice and you get the same download. When it lands, it remembers the component.",
      "React dot lazy wraps that same promise, and Suspense shows a skeleton of placeholder cards while a chunk is on its way, so the footer doesn't jump.",
      { say: "Here's the detail worth saying in an interview. A plain React dot lazy suspends once, even if the chunk already arrived, which flashes the skeleton for a frame. So the page picks, once per mount, the real component if it's loaded, and the lazy one only if it isn't.", tone: "key" },
      "And preload is exposed, so the site tour can load every page before it starts, and the tour never shows a loading state.",
    ),
  },
  {
    kind: "bullets",
    title: "No Redux: localStorage plus one event bus",
    items: [
      { icon: "💾", text: "loadJSON / saveJSON over localStorage", sub: "synchronous: a tick is on screen and on disk in the same frame" },
      { icon: "🏷", text: "every key namespaced u:{uid}:key", sub: "two accounts on one browser never see each other's cache" },
      { icon: "📣", text: "subscribe(fn) → (key, info) on every change", sub: "info says where it came from: a local save, the cloud, another tab, an account switch" },
      { icon: "🪟", text: "another tab: the browser's storage event", sub: "cross-tab consistency for free" },
      { icon: "🚫", text: "a guest's write is refused", sub: "the sign-in prompt opens; the page re-reads, so the tick un-ticks" },
    ],
    beats: B(
      "Now the data. There's no Redux. The store is a plain module: load JSON and save JSON over local storage. Synchronous. A tick is on screen and on disk in the same frame.",
      "Every key is prefixed with the signed in user's ID. U, the uid, then the key. So two accounts on one shared browser can never read each other's cached data.",
      { say: "Every save emits an event with the key, and an info object that says where the change came from. A local save, with exactly which entries changed. Data from the cloud. Another tab. Or an account switch. Pages subscribe to the keys they show, and re read.", tone: "key" },
      "Another tab writing the same key fires the browser's storage event, so every open tab stays consistent for free.",
      "And a guest's write is refused at the store. The sign in prompt opens, and the page re reads, so the change visibly doesn't stick.",
    ),
  },
  {
    kind: "decision",
    question: "Why no state library?",
    answer: "The data has to live in localStorage anyway, to survive reloads and work offline; a second copy in Redux would just be one more thing to keep in step.",
    left: { title: "Redux or Zustand", items: ["a global in-memory copy", "still needs persisting to disk", "still needs cross-tab sync", "two sources of truth"] },
    right: { title: "This store", items: ["localStorage is the truth", "events say what changed", "storage event: other tabs", "pages re-read what they show"] },
    footer: "the cost: discipline. A page must subscribe to every key it shows",
    beats: B(
      "So the first design question. Why no state library?",
      { say: "Because the data has to live in local storage anyway, to survive a reload and to work offline. A second copy in Redux would just be one more thing to keep in step.", tone: "key" },
      "With Redux, you'd hold a global copy in memory, then still persist it to disk, still sync it across tabs, and now you have two sources of truth. With this store, local storage is the truth, events say what changed, the storage event covers other tabs, and pages re read what they show.",
      "The cost is discipline. A page has to subscribe to every key it displays, or it shows stale data. That's a rule you can state, and check in review.",
    ),
  },
  check({
    topic: "the React shell",
    q: "Why does lazyPage() pick the loaded component when it can, instead of always using React.lazy?",
    say: "Why does the lazy page wrapper pick the loaded component when it can, instead of always using React lazy?",
    a: "React.lazy suspends once even when the chunk has already arrived, which flashes the loading skeleton. A preloaded page renders straight away.",
    aSay: "Because React lazy suspends once, even when the chunk has already arrived, and that flashes the loading skeleton for a frame. Picking the loaded component means a preloaded page renders straight away.",
  }),

  // ------------------------------------------------------------ 4
  sec("4", "Offline-first: local cache first, Firestore second", "Topic four. The offline first DSA tracker. What happens between a tick and Firestore."),
  shot(
    "dsa.jpg",
    "The DSA tracker",
    ["Problems by pattern, shipped with the page", "A tick is saved on this device first", "Counts and the ring read the local store", "Firestore gets it in the background"],
    [[50, 50, 1], [50, 38, 1.35], [80, 14, 1.9], [50, 50, 1]],
    B(
      "Here's the DSA tracker. The most asked problems, grouped by pattern. The problem list is static data, shipped inside the page's own chunk, so browsing needs no API at all.",
      "When a student ticks a problem, the tick is saved on this device first. Instantly. With the time it was solved, so the page can say solved three days ago.",
      "The solved count, the ring, the per pattern bars, all of them read the local store. None of them waits on a network call.",
      { say: "And Firestore gets the change in the background. That's what offline first means in the resume line: saves progress to a local cache, and syncs it to Firestore.", tone: "key" },
    ),
  ),
  {
    kind: "seq",
    title: "One tick, from click to Firestore",
    actors: [
      { id: "pg", name: "DSA page", icon: "🖱" },
      { id: "st", name: "Store", icon: "💾" },
      { id: "sy", name: "Sync engine", icon: "🔄" },
      { id: "fs", name: "Firestore", icon: "🔥" },
    ],
    msgs: [
      { from: "pg", to: "st", label: "saveJSON(DSAPrepCompleted)", step: 1 },
      { from: "st", to: "sy", label: "event: ids = [two-sum]", step: 2 },
      { from: "sy", to: "sy", label: "journal: { two-sum: editedAt }", step: 3, tone: "amber" },
      { from: "sy", to: "fs", label: "800 ms quiet → push entry + edit time", step: 4, tone: "green" },
      { from: "fs", to: "sy", label: "snapshot: other devices see it", step: 5, dash: true },
    ],
    note: { step: 6, text: "offline: the journal keeps it · the online event pushes at once · retries back off 1 s → 30 s", tone: "green" },
    beats: B(
      "Let's follow one tick, from the click to Firestore.",
      "The page calls save JSON. Local storage is updated. That's the only thing the click waits for.",
      "The store emits an event saying exactly which entry changed. Two sum.",
      { say: "The sync engine writes that entry into a pending journal, in local storage too, with the time it was edited. So the change is recorded as owed to the cloud before anything leaves the device.", tone: "key" },
      "After eight hundred milliseconds with no further changes, it pushes the entry and its edit time to Firestore. Ten quick ticks become one write.",
      "Firestore's snapshot listener on your other devices delivers it, and their stores update.",
      { say: "And if you're offline, nothing is lost. The journal keeps it. The browser's online event pushes it the moment you're back. And a failed push retries with backoff, one second, doubling, up to thirty seconds.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "When two devices disagree",
    items: [
      { icon: "🧩", text: "Per entry, not per document", sub: "a tick on the phone and a tick on the laptop both survive" },
      { icon: "🕒", text: "The newer edit wins, by its edit time", sub: "edit times are stored beside the values, in _meta" },
      { icon: "🪦", text: "Deletes are tombstones", sub: "a deleted entry keeps its edit time, so an old copy can't resurrect it" },
      { icon: "⏱", text: "A 5-minute clock-skew guard", sub: "\"the cloud went back in time\" only counts beyond 5 minutes" },
      { icon: "🚦", text: "No push before the first server snapshot", sub: "a stale device can't overwrite newer edits after a reload" },
    ],
    beats: B(
      "Now the hard question. Two devices change data while apart. Who wins? First, the unit of merging is the entry, not the document. A tick on problem A on the phone and a tick on problem B on the laptop both survive.",
      "For the same entry, the newer edit wins, by its edit time. Edit times are stored beside the values, in a meta map.",
      "Deletes are tombstones. A deleted entry keeps its edit time, so an older copy on another device can't bring it back.",
      "Device clocks drift, so the cloud only counts as having gone back in time when it's more than five minutes older. Two slightly wrong clocks can't flip a value back and forth forever.",
      { say: "And after a reload, nothing is pushed until the first server snapshot has arrived and been merged. A device that's been asleep for a week can't overwrite this morning's edits from your laptop.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Other ways you could have done it",
    cols: [
      { title: "Read Firestore directly", icon: "🌐", tone: "red", items: ["every screen waits on the network", "no local truth to show offline"] },
      { title: "Firestore's offline cache alone", icon: "🗄", tone: "amber", items: ["used too: IndexedDB, multi-tab", "but last write to a field wins"] },
      { title: "CRDTs", icon: "🧬", tone: "purple", items: ["merge without conflicts", "metadata per entry, a library to own"] },
      { title: "This: store + journal", icon: "✅", tone: "green", items: ["instant UI, works offline", "per-entry newer-wins, tombstones"] },
    ],
    footer: "Firestore's own queue delivers what it's handed; the journal records what changed and when, which the merge rules need",
    beats: B(
      "And the alternatives, so you can say you chose this deliberately. One. Read Firestore directly. Every screen waits on the network, and there's no local truth to show offline.",
      "Two. Rely only on Firestore's offline cache. It is used: a persistent IndexedDB cache with a multi tab manager. But on its own, the last write to a field wins, whoever wrote it.",
      "Three. CRDTs. They merge without conflicts, but they add metadata per entry and a library to own, for ticks and stars.",
      "So, the store plus a journal. Instant UI, it works offline, and per entry newer wins with tombstones.",
      { say: "And the line to say if they ask why both a journal and Firestore's queue. Firestore's queue delivers the writes it has been handed. The journal records what changed, and when, which the merge rules need, and it covers the window before a write is handed over: the debounce, a crash, a refresh.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "The attack",
    text: "\"Offline-first? Does your app even load without internet?\"",
    after: "offline-first is where the data lives: once the page is open, every read and write works with no network, and syncs later",
    beats: B(
      "And here's the attack on this line.",
      { say: "Offline first? Does your app even load without internet?", tone: "ask" },
      { say: "Your answer. Offline first is about where the data lives. Every read and every write goes to the local cache first, and Firestore is synced behind it. Once the page is open, you can lose the network for a day, keep ticking and writing, and it all syncs when you're back. The app shell itself comes from the CDN, and caching it with a service worker is the natural next step, a single file on top of a data layer that's already offline.", tone: "key" },
    ),
  },
  check({
    topic: "offline-first",
    q: "Your laptop ticked problem A at 10:00. Your phone, offline, un-ticked problem A at 10:05, then came online at 11:00. What does the account end up with?",
    say: "Your laptop ticked problem A at ten o'clock. Your phone, offline, un-ticked problem A at five past ten, then came online at eleven. What does the account end up with?",
    options: ["Ticked: the laptop pushed first", "Un-ticked: the phone's edit to that entry is newer", "Ticked: deletes never sync", "A conflict the user must resolve"],
    oSay: ["Ticked, because the laptop pushed first", "Un-ticked, because the phone's edit to that entry is newer", "Ticked, because deletes never sync", "A conflict the user must resolve"],
    answer: 1,
    a: "Un-ticked. Per entry, the newer edit wins by its edit time, not by who pushed first: the un-tick was edited at 10:05, the tick at 10:00.",
    aSay: "B. Un-ticked. For each entry, the newer edit wins by its edit time, not by who reached the server first. The un-tick was edited at five past ten, so it beats the ten o'clock tick.",
  }),
];
