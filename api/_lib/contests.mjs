// Upcoming LeetCode, Codeforces and CodeChef contests, normalised to one shape:
//   { id, platform, name, url, start (ms since epoch), durationMin }
//
// Primary source is clist.by — the same query the old contest-api service
// (github.com/kmr-rohit/contest-api) made, now run from here, with two fixes:
//   • its duration__gt=5400 filter dropped every LeetCode contest (they last
//     exactly 90 minutes), so durations are no longer filtered there;
//   • clist's times carry no "Z", so they were read as local time.
// The key lives in CLIST_USERNAME / CLIST_API_KEY, never in the code.
//
// Without a key, or if clist fails, the three platforms' own public endpoints
// are asked directly, so the page and the reminders keep working either way.

export const PLATFORMS = {
  leetcode: { label: "LeetCode", host: "leetcode.com" },
  codeforces: { label: "Codeforces", host: "codeforces.com" },
  codechef: { label: "CodeChef", host: "codechef.com" },
};
const BY_HOST = Object.fromEntries(Object.entries(PLATFORMS).map(([k, p]) => [p.host, k]));

// Anything longer is a marathon or a practice event, not a contest you'd
// sit down for (CodeChef and Codeforces both list a few).
const MAX_DURATION_MIN = 6 * 60;
const TIMEOUT_MS = 8000;

const withTimeout = (init = {}) => ({ ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });

async function getJSON(url, init) {
  const res = await fetch(url, withTimeout(init));
  if (!res.ok) throw new Error(`${new URL(url).host} answered ${res.status}`);
  return res.json();
}

// ── clist.by ────────────────────────────────────────────────────────────────
async function fromClist(username, apiKey) {
  const params = new URLSearchParams({
    upcoming: "true",
    end_time__during: String(30 * 24 * 3600), // the next 30 days
    host__regex: "^(leetcode\\.com|codeforces\\.com|codechef\\.com)$",
    order_by: "start",
    limit: "100",
    format: "json",
    username,
    api_key: apiKey,
  });
  const data = await getJSON(`https://clist.by/api/v4/json/contest/?${params}`);
  return (data.objects || [])
    .map((o) => {
      const platform = BY_HOST[o.host] || BY_HOST[o.resource];
      if (!platform) return null; // the host filter is enforced here too
      return {
        id: `${platform}:${o.id}`,
        platform,
        name: o.event,
        url: o.href,
        start: Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(o.start) ? o.start : `${o.start}Z`),
        durationMin: Math.round(o.duration / 60),
      };
    })
    .filter(Boolean);
}

// ── The platforms themselves ────────────────────────────────────────────────
async function fromLeetCode() {
  const data = await getJSON("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com/contest/" },
    body: JSON.stringify({ query: "{ upcomingContests { title titleSlug startTime duration } }" }),
  });
  return (data?.data?.upcomingContests || []).map((c) => ({
    id: `leetcode:${c.titleSlug}`,
    platform: "leetcode",
    name: c.title,
    url: `https://leetcode.com/contest/${c.titleSlug}/`,
    start: c.startTime * 1000,
    durationMin: Math.round(c.duration / 60),
  }));
}

async function fromCodeforces() {
  const data = await getJSON("https://codeforces.com/api/contest.list?gym=false");
  if (data.status !== "OK") throw new Error("codeforces.com: " + (data.comment || data.status));
  return data.result
    .filter((c) => c.phase === "BEFORE")
    .map((c) => ({
      id: `codeforces:${c.id}`,
      platform: "codeforces",
      name: c.name,
      url: `https://codeforces.com/contests/${c.id}`,
      start: c.startTimeSeconds * 1000,
      durationMin: Math.round(c.durationSeconds / 60),
    }));
}

async function fromCodeChef() {
  const data = await getJSON(
    "https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all"
  );
  return (data.future_contests || []).map((c) => ({
    id: `codechef:${c.contest_code}`,
    platform: "codechef",
    name: c.contest_name,
    url: `https://www.codechef.com/${c.contest_code}`,
    start: Date.parse(c.contest_start_date_iso),
    durationMin: Number(c.contest_duration),
  }));
}

async function fromPlatforms() {
  const sources = { leetcode: fromLeetCode, codeforces: fromCodeforces, codechef: fromCodeChef };
  const results = await Promise.allSettled(Object.values(sources).map((f) => f()));
  const contests = [];
  const errors = {};
  Object.keys(sources).forEach((platform, i) => {
    const r = results[i];
    if (r.status === "fulfilled") contests.push(...r.value);
    else errors[platform] = String(r.reason?.message || r.reason);
  });
  return { contests, errors };
}

// ── Public ──────────────────────────────────────────────────────────────────
export async function fetchUpcomingContests({ now = Date.now(), env = process.env } = {}) {
  let contests;
  let source;
  let errors = {};

  if (env.CLIST_USERNAME && env.CLIST_API_KEY) {
    try {
      contests = await fromClist(env.CLIST_USERNAME, env.CLIST_API_KEY);
      source = "clist";
    } catch (e) {
      errors.clist = String(e.message || e);
    }
  }
  if (!contests) {
    const r = await fromPlatforms();
    contests = r.contests;
    errors = { ...errors, ...r.errors };
    source = "platforms";
  }

  const seen = new Set();
  contests = contests
    .filter((c) => c.name && c.url && Number.isFinite(c.start) && c.start > now)
    .filter((c) => !(c.durationMin > MAX_DURATION_MIN))
    .filter((c) => (seen.has(c.id) ? false : seen.add(c.id)))
    .sort((a, b) => a.start - b.start || a.name.localeCompare(b.name));

  return { contests, source, errors, fetchedAt: now };
}
