/* Saves LeetCode's whole problem list (slug, title, difficulty, acceptance
   rate, Premium flag, topic tags) to a JSON file for genDSAPriority.mjs.
   Uses the public GraphQL endpoint the problemset page itself calls; it caps a
   page at 100, so this walks the list 100 at a time.

   Usage: node scripts/fetchLeetCodeCatalog.mjs <out.json>
*/
import { writeFileSync } from "fs";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/fetchLeetCodeCatalog.mjs <out.json>");
  process.exit(1);
}

const QUERY = `query q($limit:Int,$skip:Int,$filters:QuestionListFilterInput){
  questionList(categorySlug:"",limit:$limit,skip:$skip,filters:$filters){
    totalNum data{acRate difficulty questionFrontendId isPaidOnly title titleSlug topicTags{slug}}
  }
}`;

async function page(skip) {
  const res = await fetch("https://leetcode.com/graphql/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com/problemset/", "User-Agent": "Mozilla/5.0" },
    body: JSON.stringify({ query: QUERY, variables: { limit: 100, skip, filters: {} } }),
  });
  if (!res.ok) throw new Error(`LeetCode answered ${res.status} at skip=${skip}`);
  return (await res.json()).data.questionList;
}

const first = await page(0);
const all = [...first.data];
for (let skip = 100; skip < first.totalNum; skip += 100) {
  all.push(...(await page(skip)).data);
  await new Promise((r) => setTimeout(r, 150)); // be gentle
}
writeFileSync(OUT, JSON.stringify(all));
console.log(`saved ${all.length} problems (${all.filter((q) => q.isPaidOnly).length} Premium) to ${OUT}`);
