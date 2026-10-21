# Job radar

Finds fresh backend openings in India once a day and shows them in the Jobs
page's **Openings** tab (owner account only).

It runs on your own PC through Windows Task Scheduler. **Never move it to
GitHub Actions**: the old Actions radar got the GitHub account blocked.

## What it searches

| Source | What it covers | How |
|---|---|---|
| Company boards | ~140 tracked companies (Amazon, Microsoft, Google, Uber, Atlassian, Workday/Greenhouse/Lever boards…) | `scripts/jobRadar.mjs`, each company's public jobs API |
| ATS dataset | 20,000+ companies on Greenhouse, Lever, Ashby, Workday, iCIMS, BambooHR, Paylocity | the daily dataset of [Riley-Dorrington/job-board-aggregator](https://github.com/Riley-Dorrington/job-board-aggregator), downloaded as static files |
| Indian job boards | Naukri (7 cities), Indeed India, Glassdoor India | [JobSpy](https://github.com/speedyapply/JobSpy) in a local Python venv |
| career-ops | employers on hiring systems the others can't read (IBM, Oracle, Qualcomm…; edit `career-ops-companies.yml`) | [career-ops](https://github.com/career-ops-hq/career-ops)' scanner, checked out at a pinned commit in `.radar/career-ops` |
| LinkedIn | off by default | `--linkedin` turns on the old guest-page sweep; LinkedIn rate-limits it by IP |

## Your resume drives the keywords

Each run reads your resume PDF (`RESUME_PDF` in `.radar\.env`; default
`Downloads\SHUBAM_CHAUDHARY_RESUME_SDE.pdf`) with `pdftotext` (it comes with
Git for Windows):

- **Search terms** for Naukri, Indeed and Glassdoor come from its headline and
  first language and framework (today: "java spring boot developer", "backend
  engineer java", "software engineer distributed systems", "software engineer
  microservices").
- **career-ops' title filter** uses the headline's role and focus areas.
- **The skills match** scores each opening against the skills the resume
  names, plus the extras and "want" list in `radar/skills.json`. Each opening
  also lists the skills it asks for that the resume doesn't mention.

Replace the PDF and the next run picks it up and re-scores everything. The
career-ops checkout also gets the resume as `cv.md`, so its own modes (score
a posting A–H, tailor the CV) work there: open your AI CLI in
`.radar\career-ops`.

## What it keeps

Every job, from any source, goes through the same checks:

1. **Role and place**: a backend/SDE/Java/platform/GenAI title, not senior or lead
   levels, not QA, frontend or mobile, located in India (or remote that includes India).
2. **Experience**: the fewest years it asks for, from Naukri's experience
   field, a range in the title, or the job description. 0–2 years = "fits",
   3 = "stretch", more is dropped.
3. **Pay** against your 25 LPA minimum CTC. Only one thing drops a role: the
   employer's own posted salary topping out under 22L. Everything else is kept
   with a label, so no role that could pay 25L+ is lost to an average:

   | Label | Meaning |
   |---|---|
   | 25L+ posted | the posted salary reaches 25L |
   | close | posted tops out at 22–25L (worth negotiating), or a figure read from the description text |
   | 25L+ likely | levels.fyi India: the company's p25 ≥ 25L |
   | pay maybe | its median ≥ 25L, or a Glassdoor estimate ≥ 25L |
   | pay low | its median is under 25L, but its top 10% earn 25L+ |
   | unlikely | even its top 10% earn under 25L |
   | pay ? | no data |

   levels.fyi figures are company-wide for software engineers in India, cached 30 days.
4. **Skills match**: a 0–100 score against your resume's skills (see above).

The same opening on several sources becomes one row, linking to the
employer's own page when one of the sources has it. An opening stays listed
until no source has shown it for a week (30 days at most).

## Setup (once)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\radar\setup.ps1
```

This creates `.radar\venv` with JobSpy, checks out career-ops in
`.radar\career-ops`, creates `.radar\.env`, and registers the
**CodeNITW Job Radar** task (daily at 20:00, or as soon as the PC is on
if it was off then). Pass `-Time 09:30` for another time, `-SkipTask` to skip
the task, `-RemoveTask` to delete it.

Then put the site's `CRON_SECRET` (the same value as on Vercel) into
`.radar\.env`, so each run uploads to `/api/radar`.

## Running it by hand

```powershell
node scripts\radar\run.mjs                        # full run + upload
node scripts\radar\run.mjs --dry-run              # no upload
node scripts\radar\run.mjs --only=riley,careerops # some sources only (board, riley, jobspy, careerops)
node scripts\radar\run.mjs --days=3               # dataset window (default 7)
```

A run takes about 5–10 minutes. Logs: `.radar\logs\YYYY-MM-DD.log`. The latest
list is also in `.radar\openings.json`.
