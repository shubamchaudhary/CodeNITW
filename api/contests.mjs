import { getContests } from "./_lib/contestCache.mjs";

// GET /api/contests — upcoming LeetCode, Codeforces and CodeChef contests.
//
// The 10-minute cache (see _lib/contestCache.mjs) decides when the platforms
// are actually asked. Vercel's edge keeps each answer for a minute on top of
// that, so most visits never even reach this function.
export async function GET() {
  const { contests, failed, fetchedAt } = await getContests();
  const cacheable = contests.length > 0 || failed.length === 0;
  return Response.json(
    { contests, failed, fetchedAt },
    { headers: { "Cache-Control": cacheable ? "public, s-maxage=60, stale-while-revalidate=600" : "no-store" } }
  );
}
