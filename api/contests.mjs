import { fetchUpcomingContests } from "./_lib/contests.mjs";

// GET /api/contests — upcoming LeetCode, Codeforces and CodeChef contests.
// Vercel's edge caches a good answer for 15 minutes, so the page stays fast
// and the sources (and clist's 10-requests-a-minute limit) are left alone.
export async function GET() {
  const { contests, errors, fetchedAt } = await fetchUpcomingContests();
  const failedPlatforms = Object.keys(errors).filter((k) => k !== "clist");
  const healthy = failedPlatforms.length === 0;
  return Response.json(
    { contests, failed: failedPlatforms, fetchedAt },
    { headers: { "Cache-Control": healthy ? "public, s-maxage=900, stale-while-revalidate=3600" : "no-store" } }
  );
}
