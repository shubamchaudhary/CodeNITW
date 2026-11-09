import type { Scene } from "../../lib/types.ts";
import { B, check, sec, shot } from "./h.ts";

// Part 1: how the lecture works, what the site is, the resume as a map, and
// the whole system on one board.
export const p1: Scene[] = [
  {
    kind: "title",
    eyebrow: "Projects · InterviewPlanPrep",
    title: "InterviewPlanPrep, end to end",
    subtitle: "A local-first React app: git-style notes, a planner, a DSA tracker and contest reminders",
    beats: B(
      "InterviewPlanPrep. The interview prep platform on your resume, the one you built and still run. This one is mostly frontend, so we'll keep it short. But every line on the resume gets defended, hard.",
    ),
  },
  {
    kind: "bullets",
    title: "How each topic will go",
    firstItemStep: 1,
    items: [
      { icon: "🎯", text: "What the student sees", sub: "a real screen from the site" },
      { icon: "🧱", text: "The mechanism behind it", sub: "the code path, step by step" },
      { icon: "⚖️", text: "What else you could have done", sub: "and why you didn't" },
      { icon: "🛡", text: "The attack, and your answer", sub: "the sceptical question an interviewer asks about that resume line" },
      { icon: "✋", text: "A check", sub: "answer out loud before the answer appears" },
    ],
    beats: B(
      "Here's how each topic goes.",
      "First, what the student actually sees. A real screen from the site, the way a signed in student sees it. Nothing owner only.",
      "Then the mechanism behind that screen. The code path, step by step.",
      "Then what else you could have done, and why you didn't.",
      { say: "Then the attack. The sceptical question an interviewer asks about that exact resume line, and the answer that shuts it down.", tone: "key" },
      "And then a check. A question, a few seconds to think, and you answer out loud before the answer appears.",
    ),
  },

  // ------------------------------------------------------------ 1
  sec("1", "What it is, and your resume as a map", "Topic one. What the site is, and your resume, read as a map of this lecture."),
  shot(
    "landing.jpg",
    "What a student opens",
    ["One React app, five pages", "Planner is the home page", "Browse freely; sign in to keep progress", "Every change syncs to every device"],
    [[50, 50, 1], [50, 18, 1.5], [65, 25, 1.7], [50, 70, 1.25]],
    B(
      "This is what a student opens. One React app with five pages: Core Stack, DSA, Planning, Jobs and Contests.",
      "The home page is the planner. Plan the day, time it, see what's done.",
      "Anyone can browse every page without an account. The moment you try to change something, tick a problem, write a note, plan a day, the site asks you to sign in.",
      { say: "And once you're signed in, everything you do is saved on the device first, and synced to your account, so the same progress shows up on your laptop and your phone.", tone: "key" },
    ),
  ),
  {
    kind: "bullets",
    title: "Bullet 1: what it is",
    items: [
      { icon: "👥", text: "Interview-prep platform serving 250+ students", sub: "topic 11: where the number comes from, and how it is counted" },
      { icon: "🧮", text: "Covering DSA", sub: "a tracker of the most-asked problems, by pattern (topic 4)" },
      { icon: "☕", text: "Java & Spring Boot", sub: "Core Stack: a topic list, a reading list, and your own notes (topics 5 to 7)" },
      { icon: "💼", text: "A job tracker and upcoming coding contests", sub: "a pipeline board · contests with reminders (topics 9 and 10)" },
    ],
    beats: B(
      "Bullet one says what it is. An interview prep platform serving two hundred and fifty plus students. Topic eleven covers exactly where that number comes from.",
      "Covering DSA. A tracker of the most asked problems, grouped by pattern. Topic four.",
      "Java and Spring Boot. That's Core Stack: a topic list, what to watch, and your own notes on every topic. Topics five to seven.",
      "A job tracker, and upcoming coding contests. Topics nine and ten.",
    ),
  },
  {
    kind: "bullets",
    title: "Bullets 2 and 3: the engineering",
    items: [
      { icon: "🗓", text: "Day planner: drag-and-drop tasks and a Pomodoro timer", sub: "topic 8: native drag and drop, a timer that counts by the clock" },
      { icon: "🏁", text: "Contests from the clist.by API, cached, with email reminders", sub: "topics 9 and 10: four caches, cron, a claim before every email" },
      { icon: "🌿", text: "Git-style notes: append-only history, restore, three-way merge", sub: "topics 6 and 7: revisions, compare-and-swap, merge3" },
      { icon: "📴", text: "Offline-first DSA tracker: local cache, synced to Firestore", sub: "topic 4: the store, the pending journal, per-entry merging" },
    ],
    beats: B(
      "Bullets two and three are the engineering. A day planner with drag and drop tasks, and a Pomodoro timer. Topic eight.",
      "Upcoming contests fetched from the clist dot by API, with cached results, and email reminders before each contest. Topics nine and ten.",
      { say: "Git style notes. An append only version history, restore, and a three way merge for edits made on two devices at once. Topics six and seven. This is the part interviewers dig into, so we go slowest there.", tone: "key" },
      "And an offline first DSA tracker that saves to a local cache and syncs to Firestore. Topic four.",
    ),
  },
  {
    kind: "big",
    tone: "idea",
    lead: "The one sentence that ties it together",
    text: "The browser owns the data it shows. Firestore keeps every device in step.",
    after: "the server only does what a browser can't be trusted with: secrets, other people's emails, schedules",
    beats: B(
      "If you remember one sentence from this lecture, make it this one.",
      { say: "The browser owns the data it shows. Firestore keeps every device in step.", tone: "key" },
      "And the server only does what a browser can't be trusted with. Secrets, other people's email addresses, and anything that has to run on a schedule.",
    ),
  },
  check({
    topic: "what it is",
    q: "A guest opens the DSA page and ticks a problem. What happens?",
    options: ["The tick is saved locally and synced later", "The tick is refused, the sign-in prompt opens, and the box un-ticks", "The tick is sent to Firestore under an anonymous account", "Nothing: the checkbox is disabled for guests"],
    answer: 1,
    a: "Guests can read everything but change nothing: the store refuses the write, the sign-in prompt opens, and the page re-reads so the tick visibly undoes.",
    aSay: "B. Guests can read everything but change nothing. The store refuses the write, the sign in prompt opens, and the page re reads its data, so the tick visibly undoes.",
  }),

  // ------------------------------------------------------------ 2
  sec("2", "The whole system on one board", "Topic two. The whole system, on one board. Five boxes, and one rule for which box does what."),
  {
    kind: "flow",
    title: "The whole system",
    cols: 3,
    rows: 3,
    nodeW: 420,
    nodeH: 130,
    nodes: [
      { id: "ui", label: "React SPA\nVercel CDN", c: 0, r: 0, tone: "blue" },
      { id: "store", label: "Store\nlocalStorage", c: 0, r: 1, tone: "green" },
      { id: "sync", label: "Sync engine", c: 0, r: 2, tone: "green" },
      { id: "auth", label: "Firebase Auth\nID token (JWT)", c: 1, r: 0, tone: "amber" },
      { id: "cron", label: "Vercel Cron\nevery ~15 min", c: 1, r: 1, tone: "purple" },
      { id: "fs", label: "Firestore\nsecurity rules", c: 1, r: 2, tone: "amber" },
      { id: "api", label: "Vercel functions\nNode.js", c: 2, r: 0, tone: "purple" },
      { id: "ext", label: "clist.by\nGmail SMTP", c: 2, r: 1, tone: "pink" },
    ],
    edges: [
      { from: "ui", to: "store", label: "read" },
      { from: "store", to: "sync", label: "changes" },
      { from: "sync", to: "fs", label: "push" },
      { from: "ui", to: "auth", label: "sign in" },
      { from: "auth", to: "api", label: "ID token" },
      { from: "cron", to: "api", label: "reminder job" },
      { from: "api", to: "ext", label: "fetch · email" },
    ],
    show: [["ui"], ["store"], ["sync", "fs"], ["auth"], ["api"], ["cron", "ext"]],
    beats: B(
      "One. The app itself. A React single page app, built with Vite, served as static files from Vercel's CDN. Every page is its own chunk.",
      { say: "Two. Every page reads and writes a small store over local storage. Synchronously. Nothing on screen ever waits for the network.", tone: "key" },
      "Three. A sync engine, running in the background, pushes changes to Firestore and listens for changes from your other devices.",
      "Four. Firebase Auth. Email and password, or Google. It issues an ID token, a signed J W T, and the Firestore SDK attaches it to every request automatically.",
      "Five. Vercel serverless functions, running on Node dot js. The contest list, reminder sign ups, email links. The browser calls them with its ID token as a bearer token.",
      "And six. Vercel Cron calls the reminder job about every fifteen minutes, and the functions talk to the outside world: clist dot by for contests, and Gmail over S M T P for email.",
    ),
  },
  {
    kind: "compare",
    title: "Why each piece",
    cols: [
      { title: "React + Vite", icon: "⚛️", tone: "blue", items: ["one bundle per page", "dev server on native ES modules"] },
      { title: "Firebase", icon: "🔥", tone: "amber", items: ["auth without an auth server", "real-time listeners, offline cache, per-user rules"] },
      { title: "Vercel", icon: "▲", tone: "purple", items: ["CDN, functions and cron in one repo", "free for bursty traffic"] },
      { title: "Tailwind", icon: "🎨", tone: "green", items: ["colour tokens in CSS variables", "dark mode without a dark: partner per class"] },
    ],
    footer: "no server to patch, no database to run: the hard parts are in the browser and in the rules",
    beats: B(
      "Why each piece. React with Vite: every page is its own bundle, and the dev server serves native ES modules, so a change shows instantly. The project started on Create React App and moved to Vite in December twenty twenty three.",
      "Firebase: sign in without running an auth server, and a database with real time listeners, an offline cache, and security rules per user.",
      "Vercel: the CDN, the functions and the cron jobs live in the same repo as the app, on a free plan that suits bursty student traffic.",
      "Tailwind: every colour is a token in a CSS variable, so dark mode is one class on the root, not a dark variant on every element.",
      { say: "So there's no server to patch and no database to run. The hard engineering is in the browser and in the security rules. That's what the rest of this lecture is about.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "The attack",
    text: "\"Your resume says Node.js. Where is the Node?\"",
    after: "every file in api/ is a Node.js function: Web Request in, Response out, firebase-admin and Nodemailer inside",
    beats: B(
      "Here's the first attack.",
      { say: "Your resume says Node dot js. Where is the Node?", tone: "ask" },
      { say: "Your answer. Every file in the A P I folder is a Node dot js serverless function. A standard web request comes in, a response goes out. Inside, firebase admin talks to the server only collections, and Nodemailer sends email over S M T P. And in development, a small Vite plugin runs the same files inside the dev server, so there's one code path for local and production.", tone: "key" },
    ),
  },
  check({
    topic: "the board",
    q: "Why does the reminder email job have to run on the server, not in the browser?",
    a: "It needs secrets (the Gmail app password, the cron secret), other people's email addresses, and a schedule that runs when nobody has the site open.",
    aSay: "Three reasons. It needs secrets, the Gmail app password and the cron secret. It needs other people's email addresses, which no browser may read. And it has to run on a schedule, when nobody has the site open.",
  }),
];
