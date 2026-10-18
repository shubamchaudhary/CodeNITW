"""Collect LeetCode Discuss posts that mention system design, then fetch each post's full text.

Step 1 of the HLD page's ranking (step 2 is analyze.py). Keep <data_dir>
outside the repo: it holds ~15,000 posts (list.json, content.jsonl) and a
rerun resumes where the last one stopped.

usage: python -I scripts/hld/collect.py <data_dir>
"""
import json, os, sys, time, random, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

DATA = sys.argv[1]
URL = "https://leetcode.com/graphql"
HDR = {
    "Content-Type": "application/json",
    "Referer": "https://leetcode.com/discuss/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36",
}

def gql(query, variables, tries=6):
    body = json.dumps({"query": query, "variables": variables}).encode()
    for i in range(tries):
        try:
            req = urllib.request.Request(URL, data=body, headers=HDR)
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.loads(r.read().decode())
        except Exception as e:
            time.sleep(2 * (i + 1) + random.random())
    return None

LIST_Q = """query q($orderBy: ArticleOrderByEnum, $keywords: [String]!, $skip: Int, $first: Int) {
  ugcArticleDiscussionArticles(orderBy: $orderBy, keywords: $keywords, tagSlugs: [], skip: $skip, first: $first) {
    totalNum pageInfo { hasNextPage }
    edges { node { title slug summary createdAt topicId hitCount tags { slug } } } } }"""

CONTENT_Q = """query q($topicId: ID!) { ugcArticleDiscussionArticle(topicId: $topicId) { title content createdAt } }"""

def list_all():
    path = os.path.join(DATA, "list.json")
    if os.path.exists(path):
        return json.load(open(path, encoding="utf-8"))
    posts = {}
    for kw in ["HLD", "system design", "high level design", "design round"]:
        for order in ["MOST_RECENT", "MOST_RELEVANT", "MOST_VOTES"]:
            skip = 0
            while skip < 3000:
                d = gql(LIST_Q, {"orderBy": order, "keywords": [kw], "skip": skip, "first": 50})
                if not d or "data" not in d or not d["data"] or not d["data"]["ugcArticleDiscussionArticles"]:
                    print("list stop", kw, order, skip, (d or {}).get("errors"), flush=True)
                    break
                res = d["data"]["ugcArticleDiscussionArticles"]
                for e in res["edges"]:
                    n = e["node"]
                    posts[str(n["topicId"])] = n
                skip += 50
                if not res["pageInfo"]["hasNextPage"]:
                    break
                time.sleep(0.15)
            print("listed", kw, order, "->", len(posts), flush=True)
    json.dump(posts, open(path, "w", encoding="utf-8"))
    return posts

def fetch_contents(posts):
    path = os.path.join(DATA, "content.jsonl")
    done = set()
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            try:
                done.add(json.loads(line)["topicId"])
            except Exception:
                pass
    todo = [tid for tid in posts if tid not in done]
    print("to fetch", len(todo), "already", len(done), flush=True)
    out = open(path, "a", encoding="utf-8")
    def one(tid):
        d = gql(CONTENT_Q, {"topicId": tid})
        art = (d or {}).get("data", {}) or {}
        art = art.get("ugcArticleDiscussionArticle")
        return tid, art
    n = 0
    with ThreadPoolExecutor(max_workers=6) as ex:
        for f in as_completed([ex.submit(one, t) for t in todo]):
            tid, art = f.result()
            if art:
                out.write(json.dumps({"topicId": tid, "title": art.get("title"), "content": art.get("content"), "createdAt": art.get("createdAt"), "tags": [t["slug"] for t in posts[tid].get("tags") or []]}) + "\n")
                out.flush()
            n += 1
            if n % 250 == 0:
                print("fetched", n, "/", len(todo), flush=True)
    out.close()

if __name__ == "__main__":
    p = list_all()
    print("unique posts", len(p), flush=True)
    fetch_contents(p)
    print("DONE", flush=True)
