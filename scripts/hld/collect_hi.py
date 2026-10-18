"""Save HelloInterview's community question database: every reported interview
question, each with its individual reports (company, level, region, date).

The second source for the HLD page's ranking, next to collect.py; analyze.py
reads it with --hi. It's the public endpoint behind the "Asked at" badges on
HelloInterview's breakdown pages, and one request returns the whole database.

usage: python -I scripts/hld/collect_hi.py <data_dir>   (writes <data_dir>/hi_questions.json)
"""
import json, os, sys, time, urllib.parse, urllib.request

OUT = sys.argv[1]
URL = "https://www.hellointerview.com/trpc/intelligence/getQuestionsAndUpvotes"
HDR = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36"}

# Paging is ignored without a breakdown filter, so ask for everything at once.
q = urllib.parse.quote(json.dumps({"0": {"json": {"page": 1, "pageSize": 10000, "atLeastOneUpvote": False}}}))
for attempt in range(5):
    try:
        with urllib.request.urlopen(urllib.request.Request(f"{URL}?batch=1&input={q}", headers=HDR), timeout=120) as r:
            data = json.loads(r.read().decode())[0]["result"]["data"]["json"]
        break
    except Exception as e:
        if attempt == 4:
            raise
        time.sleep(3 * (attempt + 1))

questions = data["questions"]
if len(questions) < data["totalCount"]:
    sys.exit(f"got {len(questions)} of {data['totalCount']} questions; raise pageSize")
json.dump(questions, open(os.path.join(OUT, "hi_questions.json"), "w", encoding="utf-8"))
reports = sum(len(x.get("upvotes") or []) for x in questions)
print(f"saved {len(questions)} questions, {reports} reports")
