"""JobSpy source for the job radar: Naukri, Indeed India and Glassdoor India.

Usage: python -I jobspy_fetch.py <queries.json>
The JSON is {"hours_old": 72, "queries": [{"site", "term", "location"}, ...]}.
Prints one JSON array of jobs on stdout; progress and errors go to stderr.
Runs on your own PC via scripts/radar/run.mjs (never in GitHub Actions).
"""
import json
import math
import sys
import time

from jobspy import scrape_jobs

FIELDS = [
    "site", "job_url", "job_url_direct", "title", "company", "location", "date_posted",
    "min_amount", "max_amount", "currency", "interval", "salary_source",
    "experience_range", "description", "skills", "company_rating",
]


def clean(v):
    if v is None:
        return None
    if isinstance(v, float) and math.isnan(v):
        return None
    if hasattr(v, "isoformat"):
        return v.isoformat()
    return v


def main():
    cfg = json.load(open(sys.argv[1], encoding="utf-8"))
    hours_old = cfg.get("hours_old", 72)
    out = []
    for q in cfg["queries"]:
        site, term, location = q["site"], q["term"], q.get("location", "")
        kw = dict(site_name=[site], search_term=term, results_wanted=q.get("results", 40),
                  hours_old=hours_old, verbose=0)
        if site in ("indeed", "glassdoor"):
            kw.update(country_indeed="India", location=location or "India")
        elif location:
            kw.update(location=location)
        t = time.time()
        try:
            df = scrape_jobs(**kw)
        except Exception as e:  # one failing board must not sink the rest
            print(f"jobspy {site} '{term}' {location}: {type(e).__name__}: {str(e)[:160]}", file=sys.stderr)
            continue
        rows = []
        for _, r in df.iterrows():
            rows.append({f: clean(r.get(f)) for f in FIELDS})
        out.extend(rows)
        print(f"jobspy {site} '{term}' {location or ''}: {len(rows)} in {time.time() - t:.1f}s", file=sys.stderr)
        time.sleep(2)  # be gentle with each board
    json.dump(out, sys.stdout)


if __name__ == "__main__":
    main()
