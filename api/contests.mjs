import { getContests } from "./_lib/contestCache.mjs";

// GET /api/contests — upcoming LeetCode, Codeforces and CodeChef contests.
//
// The 10-minute cache (see _lib/contestCache.mjs) decides when the platforms
// are actually asked. On top of that, Vercel's edge answers every visit
// straight away: an answer is fresh for 5 minutes, and after that the edge
// keeps serving it instantly while it fetches a newer one in the background
// (for up to a day) — so no visitor waits on this function or a cold start.
export async function GET() {
  const { contests, failed, fetchedAt } = await getContests();
  const cacheable = contests.length > 0 || failed.length === 0;
  return Response.json(
    { contests, failed, fetchedAt },
    { headers: { "Cache-Control": cacheable ? "public, s-maxage=300, stale-while-revalidate=86400" : "no-store" } }
  );
}
