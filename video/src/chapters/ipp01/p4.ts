import type { Scene } from "../../lib/types.ts";
import { B, check, sec, shot } from "./h.ts";

// Part 4: the day planner (native drag and drop, a wall-clock Pomodoro timer),
// the contests page (clist.by, four caches) and the reminder emails.
export const p4: Scene[] = [
  // ------------------------------------------------------------ 8
  sec("8", "The planner: drag and drop, and the Pomodoro timer", "Topic eight. The day planner. Drag and drop tasks, and a Pomodoro timer."),
  shot(
    "planner.jpg",
    "A planned day, with a focus session running",
    ["A day of tasks: topics, problems, your own", "Drag a card to reorder", "A Pomodoro timer on any task", "Time logged per task, per day"],
    [[50, 50, 1], [33, 40, 1.6], [74, 73, 1.8], [74, 96, 1.7]],
    B(
      "This is the planner, with a focus session running. A day is a list of tasks. A task can link to a Core Stack topic or a DSA problem, or be your own text. And ticking a linked task ticks the real topic, because both pages write the same completion store.",
      "Cards are reordered by dragging. Native HTML five drag and drop. No library.",
      "Any task can start a Pomodoro timer: focus sessions with short breaks in between, sized to the task's estimate.",
      { say: "And the time you focus is logged per task, per day. So the page can show planned against focused, and where the day actually went.", tone: "key" },
    ),
  ),
  {
    kind: "code",
    title: "Native drag and drop: four handlers and one splice",
    lang: "js",
    code: `const handleDragStart = (e, idx) => {
  setDragIdx(idx);
  e.dataTransfer.effectAllowed = "move";
};
const handleDragOver = (e, idx) => {
  e.preventDefault();              // allow a drop here
  e.dataTransfer.dropEffect = "move";
  setOverIdx(idx);                 // draw the drop line
};
const handleDrop = (e, idx) => {
  e.preventDefault();
  if (dragIdx !== null && dragIdx !== idx) {
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    persist(next);                 // saveJSON → synced like any edit
  }
  setDragIdx(null); setOverIdx(null);
};`,
    highlight: [[1, 4], [5, 9], [13, 15], [16, 16]],
    beats: B(
      "Here's all of it. Each card is draggable. On drag start, remember which index is moving.",
      "On drag over, prevent the default, which is what tells the browser a drop is allowed here, and remember the index under the cursor, to draw the drop line.",
      "On drop, copy the list, splice the card out of its old position, and splice it into the new one. Immutable, so React sees a new array.",
      { say: "And persist it. That's a save JSON, so a reorder is saved locally and synced to your other devices like any other edit.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Why native drag and drop",
    cols: [
      { title: "react-beautiful-dnd", icon: "📦", tone: "red", items: ["no longer maintained", "a big dependency for one list"] },
      { title: "dnd-kit", icon: "🧰", tone: "amber", items: ["touch and keyboard sensors", "the pick if reordering must work on phones"] },
      { title: "Native HTML5", icon: "✅", tone: "green", items: ["zero kilobytes", "a short vertical list with a mouse"] },
    ],
    footer: "the job is reordering a handful of cards on a desktop: the platform already does that",
    beats: B(
      "The alternatives. React beautiful D N D was the classic, and it's no longer maintained. A big dependency for one list.",
      "D N D kit is the modern choice. It has touch and keyboard sensors, so it's what I'd pick if reordering had to work on phones.",
      "Native HTML five drag and drop costs zero kilobytes, and it's exactly right for a short vertical list with a mouse.",
      { say: "So the argument. The job is reordering a handful of cards on a desktop, and the platform already does that. A library would be weight without a reason.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "The timer counts by the clock, not by ticks",
    items: [
      { icon: "🐢", text: "Background tabs throttle setInterval", sub: "to about once a minute after a few minutes hidden: counting ticks loses time" },
      { icon: "⚓", text: "Store an anchor: when remaining was last exact", sub: "on every read: elapsed = now − anchor, walking through finished sessions" },
      { icon: "💾", text: "Saved on events, not every second", sub: "start · pause · resume · extend · finish · stop" },
      { icon: "🔄", text: "Synced as one value", sub: "the timer follows the account to every tab and device" },
      { icon: "🧾", text: "No double-counted time", sub: "each timer has an id and a logged-seconds counter" },
    ],
    beats: B(
      { say: "Now the timer, and the bug that shaped it. Browsers throttle timers in background tabs. After a few minutes hidden, set interval fires about once a minute. So a timer that counts ticks loses most of the time you spent in another tab.", tone: "key" },
      "So the timer stores an anchor: the moment its remaining time was last exact. Whenever it's read, it works out how much real time has passed since the anchor, and walks through any focus and break sessions that finished meanwhile. The same catch up runs when you reopen the page.",
      "It's saved on events, not every second. While running, it's stored rewound to its start, with the anchor moved back, so it only needs writing on start, pause, resume, extend, finish and stop. Sync traffic stays tiny.",
      "It's synced as one whole value, not per field, because a session, its time left and its anchor only make sense together. So the timer follows the account to every tab and device.",
      "And time is never logged twice. Each timer has an ID and a count of seconds already logged, so when two tabs both see it stop, only the seconds not yet logged are added.",
    ),
  },
  {
    kind: "code",
    title: "The catch-up: real time, through every finished session",
    lang: "js",
    code: `function advancePomo(p, now = Date.now()) {
  if (!p || p.status !== "running") return p;
  let whole = Math.floor((now - p.anchor) / 1000);
  const nextAnchor = p.anchor + whole * 1000;   // keep the fraction
  let idx = p.currentIdx, remaining = p.remaining;
  while (whole > 0) {
    if (whole < remaining) { remaining -= whole; whole = 0; }
    else {
      whole -= remaining;                          // this session ended
      if (idx + 1 >= p.sessions.length) return { ...p, status: "complete" };
      idx += 1;
      remaining = p.sessions[idx].duration;        // focus → break → focus
    }
  }
  return { ...p, currentIdx: idx, remaining, anchor: nextAnchor };
}`,
    highlight: [[3, 4], [7, 7], [9, 12], [15, 15]],
    beats: B(
      "Here's the catch up, simplified. Whole seconds since the anchor. The new anchor keeps the leftover fraction of a second, so the count never drifts.",
      "If the time passed is less than what's left in this session, just subtract it.",
      "Otherwise this session ended. Carry the rest into the next session, focus, then break, then focus, until the time runs out, or the last session ends and the timer is complete.",
      { say: "So whether the tab was hidden for ten seconds or two hours, one call puts the timer exactly where real time says it should be.", tone: "key" },
    ),
  },
  check({
    topic: "the planner",
    q: "A 25-minute focus session is started, then the tab is hidden for 20 minutes. Why does the timer still show 5 minutes left when you come back?",
    say: "A twenty five minute focus session is started, then the tab is hidden for twenty minutes. Why does the timer still show five minutes left when you come back?",
    a: "It doesn't count ticks: it computes elapsed = now − anchor from the wall clock on every read, so throttled background timers can't lose time.",
    aSay: "Because it doesn't count ticks. On every read it computes the real time passed since its anchor, from the wall clock. So the browser throttling timers in a hidden tab can't lose any time.",
  }),

  // ------------------------------------------------------------ 9
  sec("9", "Contests from clist.by, cached four ways", "Topic nine. Upcoming coding contests, fetched from the clist dot by API, with cached results."),
  shot(
    "contests.jpg",
    "The contests page",
    ["LeetCode, Codeforces, CodeChef in one list", "Times in the student's own time zone", "One button: email reminders"],
    [[50, 50, 1], [40, 30, 1.6], [80, 13, 2]],
    B(
      "The contests page. LeetCode, Codeforces and CodeChef in one list, the next one big at the top, with a countdown.",
      "Every time is shown in the student's own time zone, grouped by day.",
      "And one button turns on email reminders. That's topic ten.",
    ),
  ),
  {
    kind: "bullets",
    title: "Where the list comes from",
    items: [
      { icon: "🌐", text: "clist.by first", sub: "one query for the three hosts, the next 30 days; the key lives only in server env" },
      { icon: "🛟", text: "Fallback: each platform's own API, in parallel", sub: "LeetCode GraphQL · Codeforces contest.list · CodeChef · Promise.allSettled, 8 s timeouts" },
      { icon: "📐", text: "Normalised to one shape", sub: "{ id, platform, name, url, start, durationMin } · future only · ≤ 6 h · de-duplicated · sorted" },
      { icon: "🐞", text: "Two bugs fixed on the way", sub: "a > 90 min filter dropped every LeetCode contest · times without a Z were read as local" },
    ],
    beats: B(
      "Where the list comes from. clist dot by first. One query covers all three hosts for the next thirty days. The API key lives only in the server's environment.",
      "If there's no key, or clist fails, each platform's own API is asked directly, in parallel, with promise all settled and eight second timeouts. So one slow platform can't hold up the others.",
      "Everything is normalised to one shape: an ID, the platform, name, URL, start time and duration. Future contests only, at most six hours long, de duplicated and sorted.",
      { say: "And two bugs worth telling as a story. The old contest API this replaced filtered out contests of ninety minutes or less, and every LeetCode contest lasts exactly ninety minutes, so LeetCode never showed. And clist's times carry no time zone marker, so they were read as local time. The parser now appends a Z when it's missing.", tone: "key" },
    ),
  },
  {
    kind: "numbers",
    title: "Four caches, each for a different reason",
    items: [
      { value: "1 min", label: "Browser", sub: "one fetch promise reused across pages", tone: "blue" },
      { value: "5 min", label: "Vercel edge", sub: "s-maxage=300 · stale-while-revalidate 1 day", tone: "purple" },
      { value: "warm", label: "Function memory", sub: "skips Firestore inside one instance", tone: "amber" },
      { value: "10 min", label: "Firestore appCache", sub: "shared by every instance and the reminder job · per platform", tone: "green" },
    ],
    footer: "an empty answer caused by failures is sent no-store: an outage is never cached",
    beats: B(
      "And the cached results. Four layers, each for a different reason. One. The browser reuses one fetch promise for a minute, so moving between pages doesn't refetch.",
      { say: "Two. Vercel's edge. Cache control, s max age three hundred, stale while revalidate one day. Every visitor gets an instant answer, and the edge refreshes in the background, so nobody ever waits on a cold start.", tone: "key" },
      "Three. The function's own memory. A warm instance skips Firestore entirely.",
      "Four. A shared copy in Firestore, fresh for ten minutes. It's shared by every serverless instance and by the reminder job. And it's kept per platform: if CodeChef fails, its last good contests stay, and it's retried after sixty seconds.",
      "And one rule on top. An empty answer caused by failures is sent with no store. An outage is never cached.",
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "The attack",
    text: "\"Four caches for a contest list? Isn't that over-engineering?\"",
    after: "each layer removes a different cost: refetching, cold starts, Firestore reads, and hammering the platforms",
    beats: B(
      "And the attack on this line.",
      { say: "Four caches for a contest list? Isn't that over engineering?", tone: "ask" },
      { say: "Your answer. Each layer removes a different cost. The browser cache stops refetching on every page. The edge hides cold starts from every visitor. Memory saves Firestore reads inside a warm instance. And the Firestore copy is the only one the reminder job can share, because serverless instances don't share memory and the job doesn't go through the CDN. It also means the platforms are asked at most once per ten minutes, however many students there are.", tone: "key" },
    ),
  },
  check({
    topic: "contests",
    q: "clist.by works, but CodeChef's data in it is missing this time. What does a student see?",
    options: ["An error page", "Only LeetCode and Codeforces, until CodeChef comes back", "The last known CodeChef contests, with fresh LeetCode and Codeforces", "An empty list, cached for a day"],
    answer: 2,
    a: "The cache is kept per platform: CodeChef's last good list stays while the others refresh, and CodeChef is retried after 60 s.",
    aSay: "C. The cache is kept per platform. CodeChef's last good list stays, the others refresh, and CodeChef is retried after sixty seconds. And an empty result is never cached.",
  }),

  // ------------------------------------------------------------ 10
  sec("10", "Email reminders before each contest", "Topic ten. Email reminders before each contest. A day before, and an hour before."),
  {
    kind: "seq",
    title: "Turning reminders on",
    actors: [
      { id: "st", name: "Student", icon: "🧑‍🎓" },
      { id: "fn", name: "/api/contest-alerts", icon: "λ" },
      { id: "db", name: "Firestore (server-only)", icon: "🔥" },
    ],
    msgs: [
      { from: "st", to: "fn", label: "POST · Authorization: Bearer <ID token>", step: 0 },
      { from: "fn", to: "fn", label: "verify token · email = token.email", step: 1, tone: "amber" },
      { from: "fn", to: "db", label: "subscriber { uid, email, timeZone }", step: 2, tone: "green" },
      { from: "fn", to: "st", label: "email/password account: confirm by email first", step: 3, dash: true },
    ],
    note: { step: 4, text: "nobody can subscribe someone else: the address comes from the verified token, never the request body", tone: "green" },
    beats: B(
      "Turning reminders on. The button calls the alerts function, with the student's Firebase ID token as a bearer token.",
      { say: "The function verifies the token with firebase admin, and takes the email address from the verified token. Never from the request body.", tone: "key" },
      "It stores the subscriber, with their time zone, in a collection only the server can reach.",
      "A Google account's email is already verified. An email and password account gets a confirmation email first, at most one every ten minutes, and receives nothing until it's confirmed. Double opt in.",
      { say: "So nobody can subscribe someone else's address. That's the security point to make.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "Scheduling on a free plan",
    items: [
      { icon: "⏰", text: "Vercel Hobby: each cron job runs at most once a day", sub: "at some minute within its hour" },
      { icon: "🔢", text: "So vercel.json declares 96 daily jobs", sub: "four per hour: together, the reminder job every ~15 minutes" },
      { icon: "🛟", text: "GitHub Actions calls it every 10 minutes too", sub: "a backup: GitHub's schedule is best-effort" },
      { icon: "🪟", text: "Reminders are windows, not instants", sub: "day: 24 h 5 min → 3 h before · hour: 65 → 2 min before" },
      { icon: "🔑", text: "Key: contestId@start:kind", sub: "a rescheduled contest is reminded about again" },
    ],
    beats: B(
      "Scheduling, on a free plan. Vercel's Hobby plan runs each cron job at most once a day, at some minute within its hour.",
      { say: "So vercel dot json declares ninety six daily jobs. Four per hour. Together, they call the reminder job about every fifteen minutes.", tone: "key" },
      "And a GitHub Actions workflow calls the same endpoint every ten minutes, as a backup, because GitHub's schedule is best effort and can skip runs.",
      "Because a run can start late, each reminder is a window, not an instant. The day reminder is due from twenty four hours and five minutes before, until three hours before. The hour reminder, from sixty five minutes until two minutes before.",
      "And each reminder's key includes the contest's start time and the kind. So if a contest is rescheduled, students are reminded again, at the new time.",
    ),
  },
  {
    kind: "seq",
    title: "Claim before send",
    actors: [
      { id: "job", name: "Reminder job", icon: "⏰" },
      { id: "tx", name: "Firestore transaction", icon: "🔒" },
      { id: "mail", name: "Gmail SMTP", icon: "✉️" },
    ],
    msgs: [
      { from: "job", to: "tx", label: "read contestReminders/{key}.sentTo", step: 0 },
      { from: "job", to: "tx", label: "write the new subscribers into sentTo", step: 1, tone: "amber" },
      { from: "job", to: "mail", label: "one email per person · all their due reminders", step: 2, tone: "green" },
      { from: "job", to: "tx", label: "send failed? release their claims", step: 3, tone: "red", dash: true },
    ],
    note: { step: 4, text: "overlapping runs can't both claim a person · never a duplicate · at worst one skipped", tone: "green" },
    beats: B(
      "And the part interviewers love. Claim before send. For each due reminder, a Firestore transaction reads who it was already sent to.",
      { say: "It keeps the subscribers not in that list, and writes them in, before any email is sent. If two runs overlap, the transaction lets only one of them claim each person.", tone: "key" },
      "Then each person gets one email per run, with all their due reminders, in their own time zone, over one pooled S M T P connection.",
      "If a send fails, that person's claims are released, deleted from the list, so the next run retries them.",
      "So overlapping runs, retries and late subscribers are all safe. Never a duplicate. At worst, one skipped email.",
    ),
  },
  {
    kind: "trap",
    myth: "\"My reminders are exactly-once.\"",
    truth: "Say: never a duplicate. At worst, one skipped email.",
    why: "the claim is written before the send; if the function dies between the claim and the send, that person is claimed but not emailed. That's the trade-off, chosen on purpose: a missed reminder is better than spam.",
    beats: B(
      "One trap to avoid.",
      { say: "Don't say exactly once. Say never a duplicate, and at worst one skipped email.", tone: "key" },
      "Because the claim is written before the send. If the function dies between the claim and the send, that person is claimed but never emailed. That's the trade off, chosen on purpose. For a reminder, a missed email is better than spam, and saying it this precisely is what convinces an interviewer.",
    ),
  },
  {
    kind: "bullets",
    title: "Email details worth naming",
    items: [
      { icon: "📮", text: "Nodemailer over Gmail SMTP, with an app password", sub: "a reputable sender without owning a domain · ~500 recipients a day" },
      { icon: "1️⃣", text: "One-click unsubscribe headers (RFC 8058)", sub: "List-Unsubscribe and List-Unsubscribe-Post" },
      { icon: "🔏", text: "Links signed with HMAC-SHA256", sub: "compared in constant time: timingSafeEqual" },
      { icon: "🖱", text: "Opening a link (GET) only shows a button; POST acts", sub: "mail scanners open every link: a GET must never change anything" },
    ],
    beats: B(
      "Four email details worth naming. Nodemailer over Gmail S M T P, with an app password. A reputable sender without owning a domain, good for about five hundred recipients a day.",
      "One click unsubscribe headers, from RFC eighty fifty eight, so mail apps show their own unsubscribe button.",
      "Every link in the email is signed with H MAC SHA two fifty six, and checked in constant time.",
      { say: "And opening a link only shows a page with a button. The change happens on the POST. Because mail providers and security scanners open every link in an email to check it, and a GET that acted would unsubscribe people on the scanner's visit.", tone: "key" },
    ),
  },
  check({
    topic: "reminders",
    q: "Two reminder runs overlap, both find the same contest due for Asha. Why does she get one email, not two?",
    say: "Two reminder runs overlap, and both find the same contest due for Asha. Why does she get one email, not two?",
    a: "Each run claims her in a Firestore transaction on sentTo before sending; only one transaction can add her, the other sees her already claimed and skips her.",
    aSay: "Because each run claims her inside a Firestore transaction on the sent to list, before sending anything. Only one transaction can add her. The other one sees her already claimed, and skips her.",
  }),
];
