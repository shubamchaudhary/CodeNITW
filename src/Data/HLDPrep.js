// HelloInterview's system design problem breakdowns, in the order to study
// them for an SDE2 loop (about 2–5 years of experience).
//
// The order is measured, not judgement. scripts/hld/collect.py pulls every
// LeetCode Discuss post the forum's search returns for "HLD", "system design",
// "high level design" and "design round" (about 15,000 posts).
// scripts/hld/analyze.py keeps the interview reports posted since 2024 and
// finds the system design question each one names, under any of its names
// ("BookMyShow" is Ticketmaster, "Ola" is Uber). It skips LLD, machine-coding
// and DSA rounds, and a component mentioned inside another design ("the API
// gateway does auth and rate limiting" is not a rate limiter question).
// Older reports are left out on purpose: before 2024 they lean to the classic
// Meta-style feed questions, and the mix has moved since.
//
// A problem's rank is its share of SDE2-level reports (titled SDE2, SSE, L4,
// MTS-2…, or 2–5 years of experience), blended 3:1 with its share of reports
// at every level. Tiers cut that same score: P0 at 6% or more, P1 3.5%, P2
// 1.75%, P3 the rest. `lists` cross-checks against 11 published "most asked"
// lists (PracHub's June 2026 merge); it doesn't move the order.
//
// Refresh the RANKING block below with:
//   python -I scripts/hld/analyze.py <data_dir> --since 2024 --write src/Data/HLDPrep.js

const BREAKDOWN = "https://www.hellointerview.com/learn/system-design/problem-breakdowns/";

// id is HelloInterview's slug. askedAs: the names the same problem is asked
// under, Indian companies' versions included. tests: what the interviewer is
// really probing.
const PROBLEMS = {
  bitly: {
    title: "Bitly",
    askedAs: ["URL shortener", "TinyURL", "Pastebin"],
    tests: "Generating short codes (a counter + base62 vs hashing) without collisions, a read-heavy redirect path behind a cache, and 301 vs 302 redirects.",
  },
  dropbox: {
    title: "Dropbox",
    askedAs: ["Google Drive", "OneDrive", "File storage & sync"],
    tests: "Uploading large files in chunks straight to blob storage with presigned URLs, resuming failed uploads, file metadata, and syncing changes across devices.",
  },
  yelp: {
    title: "Yelp",
    askedAs: ["Proximity service", "Nearby restaurants", "Google Maps places"],
    tests: "Geospatial indexing (geohash, quadtree, PostGIS) to search by location and filters, and keeping each business's average rating consistent.",
  },
  gopuff: {
    title: "Local Delivery Service",
    askedAs: ["Swiggy / Zomato", "Blinkit / Zepto", "Instacart", "Food delivery"],
    tests: "Which items are deliverable to an address from nearby warehouses, placing orders without overselling stock, and fast availability reads.",
  },
  ticketmaster: {
    title: "Ticketmaster",
    askedAs: ["BookMyShow", "Movie / event booking", "IRCTC / flight seats"],
    tests: "Holding a seat for a few minutes without double booking (distributed locks, TTL holds), a virtual waiting queue for hot events, and event search.",
  },
  instagram: {
    title: "Instagram",
    askedAs: ["Photo sharing app", "Pinterest", "Snapchat"],
    tests: "Media upload to blob storage behind a CDN, feed generation (fan-out on write vs on read), and the celebrity problem.",
  },
  "fb-news-feed": {
    title: "FB News Feed",
    askedAs: ["Twitter / X timeline", "LinkedIn feed", "Social media feed"],
    tests: "Fan-out on write vs on read, a hybrid for accounts with millions of followers, feed caching, and cursor pagination.",
  },
  tinder: {
    title: "Tinder",
    askedAs: ["Dating app", "Bumble"],
    tests: "Building a recommendation stack from location and preferences, recording swipes at high write volume, and detecting a mutual match exactly once.",
  },
  leetcode: {
    title: "LeetCode",
    askedAs: ["Online judge", "HackerRank / Codeforces", "Coding contest platform"],
    tests: "Running untrusted code safely in isolated containers, a submission queue, and a live contest leaderboard.",
  },
  whatsapp: {
    title: "WhatsApp",
    askedAs: ["Chat system", "Slack / Messenger", "Group chat"],
    tests: "WebSocket connections at scale, routing a message to whichever server holds the recipient, offline delivery and receipts, and group fan-out.",
  },
  strava: {
    title: "Strava",
    askedAs: ["Fitness tracker", "Run / ride tracking app"],
    tests: "Recording GPS points from the client (batched, works offline), computing distance and pace, and activity leaderboards.",
  },
  "distributed-cache": {
    title: "Distributed Cache",
    askedAs: ["Redis / Memcached", "In-memory key-value store"],
    tests: "Consistent hashing to spread keys across nodes, replication and failover, LRU eviction and TTLs, and hot keys.",
  },
  "distributed-rate-limiter": {
    title: "Rate Limiter",
    askedAs: ["API rate limiter", "API throttling"],
    tests: "Token bucket vs sliding window, atomic counters in Redis, limits per user, IP or API key, and what happens when the limiter's store is down.",
  },
  "online-auction": {
    title: "Online Auction",
    askedAs: ["eBay", "Real-time bidding"],
    tests: "Accepting concurrent bids so the highest one always wins, pushing the latest price to watchers in real time, and closing auctions on time.",
  },
  youtube: {
    title: "YouTube",
    askedAs: ["Netflix / Hotstar", "Video streaming", "Spotify"],
    tests: "Chunked uploads, transcoding into several resolutions as a pipeline of jobs, and adaptive bitrate streaming (HLS / DASH) over a CDN.",
  },
  "job-scheduler": {
    title: "Job Scheduler",
    askedAs: ["Distributed cron", "Task scheduler", "Delayed jobs"],
    tests: "Storing jobs by run time, handing each due job to exactly one worker, retries, and at-least-once execution.",
  },
  "fb-live-comments": {
    title: "FB Live Comments",
    askedAs: ["Live comments", "Live cricket score", "Live reactions"],
    tests: "Pushing new comments to millions of viewers (SSE or WebSockets), pub/sub partitioned by video, and connection fan-out.",
  },
  "google-news": {
    title: "News Aggregator",
    askedAs: ["Google News", "Inshorts", "RSS reader"],
    tests: "Ingesting publisher feeds, deduplicating the same story, and serving a fast, cacheable feed.",
  },
  camelcamelcamel: {
    title: "Price Tracking Service",
    askedAs: ["camelcamelcamel", "Price drop alerts", "Keepa"],
    tests: "Collecting prices for millions of products, storing price history, and alerting users when a price crosses their threshold.",
  },
  "notification-system": {
    title: "Notification System",
    askedAs: ["Push / email / SMS service", "Alerting service"],
    tests: "A queue per channel, retries with backoff, idempotency so nothing is sent twice, user preferences, and per-user rate limits.",
  },
  "top-k": {
    title: "YouTube Top K",
    askedAs: ["Top K videos / songs", "Trending hashtags", "Leaderboard"],
    tests: "Counting views over sliding time windows with stream processing, count-min sketch vs exact counts, and serving precomputed results.",
  },
  uber: {
    title: "Uber",
    askedAs: ["Ola / Rapido", "Ride sharing", "Cab booking"],
    tests: "Ingesting driver locations every few seconds, finding nearby drivers (geohash, Redis geo), and matching a ride without double-assigning a driver.",
  },
  robinhood: {
    title: "Robinhood",
    askedAs: ["Zerodha / Groww", "Stock broker", "Stock exchange"],
    tests: "Streaming live prices to clients, placing orders through an external exchange reliably, and keeping order state consistent.",
  },
  "google-docs": {
    title: "Google Docs",
    askedAs: ["Collaborative editor", "Notion / Confluence", "Collaborative code editor"],
    tests: "Concurrent edits with OT or CRDTs, a WebSocket session per document, and storing and compacting the edit history.",
  },
  "web-crawler": {
    title: "Web Crawler",
    askedAs: ["Web scraper", "Search engine crawler"],
    tests: "A URL frontier that is polite per domain, fetching at scale with retries, de-duplicating URLs and content, and recovering from crashes.",
  },
  "ad-click-aggregator": {
    title: "Ad Click Aggregator",
    askedAs: ["Click / event counting", "Real-time analytics"],
    tests: "Ingesting a click stream through Kafka, aggregating it into time buckets with Flink, an OLAP store for queries, and reconciling for accuracy.",
  },
  "fb-post-search": {
    title: "FB Post Search",
    askedAs: ["Twitter search", "Search engine", "Full-text search"],
    tests: "Building an inverted index, indexing new posts and likes quickly, and ranking by recency or likes at query time.",
  },
  "payment-system": {
    title: "Payment System",
    askedAs: ["Stripe / Razorpay", "Payment gateway", "UPI / wallet"],
    tests: "Idempotency keys, a double-entry ledger, talking to external processors through webhooks, and reconciliation.",
  },
  "metrics-monitoring": {
    title: "Metrics Monitoring",
    askedAs: ["Datadog / Prometheus", "Logging system", "Alerting"],
    tests: "Collecting metrics from many hosts, time-series storage with downsampling, dashboard queries, and an alerting pipeline.",
  },
  "online-chess": {
    title: "Online Chess",
    askedAs: ["Multiplayer game", "Chess.com", "Matchmaking"],
    tests: "Matchmaking by rating, keeping game state in sync over WebSockets, clocks, and resuming a game after a disconnect.",
  },
  chatgpt: {
    title: "ChatGPT",
    askedAs: ["LLM chat app", "AI assistant"],
    tests: "Streaming tokens to the client, storing conversations, and queueing requests for scarce GPU inference with rate limits.",
  },
  "flash-sale": {
    title: "Flash Sale",
    askedAs: ["Flipkart Big Billion Days", "Amazon Prime Day", "Limited-stock sale"],
    tests: "Absorbing a sudden spike of buyers, decrementing limited stock without overselling, and protecting checkout from the surge.",
  },
};

// RANKING_START
// Written by scripts/hld/analyze.py — rerun it rather than editing by hand.
// [id, priority, seen in interview reports { mid: SDE2-level, mid2025: of those since 2025, all: any level }, lists]
// lists: how many of 11 published "most asked" lists include it (null: not in their top 30).
const RANKING = [
  ["distributed-rate-limiter", "P0", { mid: 60, mid2025: 50, all: 99 }, 9],
  ["notification-system", "P0", { mid: 62, mid2025: 53, all: 87 }, 7],
  ["ticketmaster", "P0", { mid: 55, mid2025: 39, all: 85 }, 6],
  ["fb-news-feed", "P0", { mid: 45, mid2025: 31, all: 88 }, 10],
  ["whatsapp", "P0", { mid: 44, mid2025: 30, all: 72 }, 10],
  ["metrics-monitoring", "P0", { mid: 44, mid2025: 33, all: 64 }, 5],
  ["youtube", "P0", { mid: 42, mid2025: 26, all: 68 }, 10],
  ["payment-system", "P0", { mid: 42, mid2025: 34, all: 61 }, 6],
  ["bitly", "P1", { mid: 35, mid2025: 28, all: 57 }, 11],
  ["job-scheduler", "P1", { mid: 36, mid2025: 28, all: 52 }, 5],
  ["top-k", "P1", { mid: 33, mid2025: 22, all: 59 }, 3],
  ["uber", "P1", { mid: 25, mid2025: 20, all: 54 }, 9],
  ["instagram", "P1", { mid: 27, mid2025: 15, all: 44 }, 6],
  ["gopuff", "P2", { mid: 22, mid2025: 13, all: 40 }, 4],
  ["web-crawler", "P2", { mid: 21, mid2025: 15, all: 41 }, 8],
  ["dropbox", "P2", { mid: 19, mid2025: 11, all: 40 }, 8],
  ["robinhood", "P2", { mid: 21, mid2025: 16, all: 27 }, 4],
  ["google-docs", "P2", { mid: 18, mid2025: 11, all: 30 }, 6],
  ["fb-post-search", "P2", { mid: 14, mid2025: 10, all: 25 }, null],
  ["ad-click-aggregator", "P2", { mid: 13, mid2025: 10, all: 24 }, 5],
  ["flash-sale", "P2", { mid: 13, mid2025: 11, all: 21 }, null],
  ["leetcode", "P3", { mid: 10, mid2025: 7, all: 19 }, null],
  ["online-auction", "P3", { mid: 9, mid2025: 9, all: 19 }, null],
  ["online-chess", "P3", { mid: 8, mid2025: 3, all: 22 }, null],
  ["distributed-cache", "P3", { mid: 7, mid2025: 5, all: 16 }, 6],
  ["google-news", "P3", { mid: 7, mid2025: 3, all: 14 }, null],
  ["chatgpt", "P3", { mid: 7, mid2025: 6, all: 14 }, 3],
  ["camelcamelcamel", "P3", { mid: 8, mid2025: 8, all: 9 }, null],
  ["fb-live-comments", "P3", { mid: 6, mid2025: 3, all: 14 }, null],
  ["yelp", "P3", { mid: 4, mid2025: 3, all: 10 }, 7],
  ["tinder", "P3", { mid: 1, mid2025: 1, all: 2 }, 2],
  ["strava", "P3", { mid: 0, mid2025: 0, all: 2 }, null],
];

export const HLD_EVIDENCE = {
  posts: 1105,
  midPosts: 672,
  summary: "Ranked by how often each problem is named as the system design question in 672 SDE2-level (SDE2 / 2–5 YOE) interview reports on LeetCode Discuss, Jan 2024 – Oct 2026, out of 1105 reports at all levels.",
};
// RANKING_END

export const HLD_PRIORITY_CONFIG = {
  P0: { label: "P0", blurb: "Asked constantly — do these first", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30 light:bg-rose-50 light:text-rose-700 light:border-rose-600/15" },
  P1: { label: "P1", blurb: "Very common — expect these", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 light:bg-amber-50 light:text-amber-700 light:border-amber-600/20" },
  P2: { label: "P2", blurb: "Shows up regularly", cls: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30 light:bg-sky-50 light:text-sky-700 light:border-sky-600/15" },
  P3: { label: "P3", blurb: "Rare at SDE2 — patterns worth knowing", cls: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30 light:bg-slate-50 light:text-slate-500 light:border-slate-900/10" },
};

// One card per tier on the page, in this order.
export const HLD_TIERS = [
  { key: "P0", title: "Do these first", blurb: "Named in the most SDE2 interview reports" },
  { key: "P1", title: "Very common", blurb: "Expect at least one of these in a loop" },
  { key: "P2", title: "Shows up regularly", blurb: "Common at specific companies" },
  { key: "P3", title: "Rare at SDE2", blurb: "Worth it for the patterns they teach" },
];

export const HLD_PROBLEMS = RANKING.map(([id, priority, seen, lists], i) => ({
  id,
  rank: i + 1,
  priority,
  link: BREAKDOWN + id,
  seen,
  lists,
  ...PROBLEMS[id],
}));
