// HelloInterview's system design problem breakdowns, in the order to study
// them for an SDE2 loop (about 2–5 years of experience).
//
// The order is measured, not judgement, from real interview reports in two
// places that sample different interviews, weighted equally:
//
//   • LeetCode Discuss, mostly Indian product companies. scripts/hld/collect.py
//     pulls every post the forum's search returns for "HLD", "system design",
//     "high level design" and "design round" (about 15,000). analyze.py finds
//     the system design question each interview report names, under any of
//     its names ("BookMyShow" is Ticketmaster, "Ola" is Uber), skipping LLD,
//     machine-coding and DSA rounds and components mentioned inside another
//     design. SDE2-level: titled SDE2, SSE, L4, MTS-2…, or 2–5 years.
//   • HelloInterview's own question database, mostly US big tech
//     (scripts/hld/collect_hi.py). Each report there already carries its
//     company, level and date; mid-level is their SDE2 band. Questions that
//     are a breakdown's problem under another title count toward it ("Design
//     Online Chess" isn't linked to its breakdown, but it is that problem).
//
// Both use reports from 2024 on. Within each source a problem scores its
// share of SDE2-level reports, blended 3:1 with its share at every level,
// over the 32 problems; the rank is the average of the two. Tiers cut that
// score: P0 at 5% or more, P1 3.5%, P2 2%, P3 the rest.
//
// HelloInterview's "Asked at" badges count companies, not reports: Yelp shows
// four logos for 18 reports. They don't enter the ranking.
//
// Refresh the RANKING block below with (both collectors first):
//   python -I scripts/hld/analyze.py <data_dir> --hi <data_dir>/hi_questions.json --since 2024 --write src/Data/HLDPrep.js

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
// [id, priority, reports naming it { lc: LeetCode Discuss, hi: HelloInterview; mid: SDE2-level, all: any level }]
const RANKING = [
  ["whatsapp", "P0", { lc: { mid: 44, all: 72 }, hi: { mid: 46, all: 239 } }],
  ["ticketmaster", "P0", { lc: { mid: 55, all: 85 }, hi: { mid: 37, all: 153 } }],
  ["notification-system", "P0", { lc: { mid: 62, all: 87 }, hi: { mid: 21, all: 78 } }],
  ["distributed-rate-limiter", "P0", { lc: { mid: 60, all: 99 }, hi: { mid: 20, all: 67 } }],
  ["metrics-monitoring", "P0", { lc: { mid: 44, all: 64 }, hi: { mid: 31, all: 142 } }],
  ["job-scheduler", "P0", { lc: { mid: 36, all: 52 }, hi: { mid: 34, all: 205 } }],
  ["top-k", "P0", { lc: { mid: 33, all: 59 }, hi: { mid: 36, all: 173 } }],
  ["youtube", "P1", { lc: { mid: 42, all: 68 }, hi: { mid: 22, all: 91 } }],
  ["payment-system", "P1", { lc: { mid: 42, all: 61 }, hi: { mid: 18, all: 136 } }],
  ["web-crawler", "P1", { lc: { mid: 21, all: 41 }, hi: { mid: 31, all: 150 } }],
  ["instagram", "P1", { lc: { mid: 27, all: 44 }, hi: { mid: 28, all: 108 } }],
  ["fb-news-feed", "P1", { lc: { mid: 45, all: 88 }, hi: { mid: 11, all: 25 } }],
  ["leetcode", "P1", { lc: { mid: 10, all: 19 }, hi: { mid: 38, all: 187 } }],
  ["bitly", "P1", { lc: { mid: 35, all: 57 }, hi: { mid: 17, all: 67 } }],
  ["dropbox", "P2", { lc: { mid: 19, all: 40 }, hi: { mid: 22, all: 72 } }],
  ["ad-click-aggregator", "P2", { lc: { mid: 13, all: 24 }, hi: { mid: 23, all: 145 } }],
  ["online-chess", "P2", { lc: { mid: 8, all: 22 }, hi: { mid: 26, all: 164 } }],
  ["online-auction", "P2", { lc: { mid: 9, all: 19 }, hi: { mid: 23, all: 86 } }],
  ["yelp", "P2", { lc: { mid: 4, all: 10 }, hi: { mid: 26, all: 103 } }],
  ["fb-post-search", "P2", { lc: { mid: 14, all: 25 }, hi: { mid: 17, all: 66 } }],
  ["uber", "P2", { lc: { mid: 25, all: 54 }, hi: { mid: 6, all: 21 } }],
  ["gopuff", "P2", { lc: { mid: 22, all: 40 }, hi: { mid: 7, all: 28 } }],
  ["camelcamelcamel", "P2", { lc: { mid: 8, all: 9 }, hi: { mid: 21, all: 60 } }],
  ["google-news", "P3", { lc: { mid: 7, all: 14 }, hi: { mid: 14, all: 103 } }],
  ["robinhood", "P3", { lc: { mid: 21, all: 27 }, hi: { mid: 4, all: 45 } }],
  ["google-docs", "P3", { lc: { mid: 18, all: 30 }, hi: { mid: 7, all: 26 } }],
  ["chatgpt", "P3", { lc: { mid: 7, all: 14 }, hi: { mid: 11, all: 43 } }],
  ["distributed-cache", "P3", { lc: { mid: 7, all: 16 }, hi: { mid: 8, all: 51 } }],
  ["fb-live-comments", "P3", { lc: { mid: 6, all: 14 }, hi: { mid: 9, all: 51 } }],
  ["flash-sale", "P3", { lc: { mid: 13, all: 21 }, hi: { mid: 1, all: 8 } }],
  ["tinder", "P3", { lc: { mid: 1, all: 2 }, hi: { mid: 2, all: 3 } }],
  ["strava", "P3", { lc: { mid: 0, all: 2 }, hi: { mid: 1, all: 1 } }],
];

export const HLD_EVIDENCE = {
  lcMid: 672,
  hiMid: 954,
  summary: "Ranked on real interview reports from two places, weighted equally: 672 SDE2-level (2–5 YOE) reports on LeetCode Discuss, mostly Indian companies, and 954 mid-level reports in HelloInterview's question database, mostly US big tech. Jan 2024 – Oct 2026.",
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

export const HLD_PROBLEMS = RANKING.map(([id, priority, seen], i) => ({
  id,
  rank: i + 1,
  priority,
  link: BREAKDOWN + id,
  seen,
  ...PROBLEMS[id],
}));
