# Job radar

Finds fresh backend openings in India five times a day (06:00, 09:00, 13:00,
16:00 and 22:00 IST), stores them in Firestore
through the site's `/api/radar`, and serves them back to any device with a
token, and to the Jobs page's **Openings** tab (owner account only).

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
2. **Experience**: the range of years it asks for, from Naukri's experience
   field, a range in the title, or the job description, must include 2
   (`YOUR_YEARS` in `experience.mjs`). "0–2", "1–3", "2–5" and "1+" stay; "3+"
   and "3–5" ask for more, "0–1" for less, and are dropped. A posting that
   doesn't say is kept, unless its title is senior.
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
   An opening with 0 (no skill in common) is dropped.

An opening a run drops is also sent to the API to delete, so one stored under
earlier rules goes the next time a run sees it. Openings are always listed
newest first.

The same opening on several sources becomes one row, linking to the
employer's own page when one of the sources has it. It counts as still
listed while a source showed it in the last week, and is kept 15 days after
it opened.

## Where the data goes

Firestore is the record; the PC keeps only a cache.

```
PC, 5×/day POST /api/radar──▶ interviewplanprep (Vercel) ──▶ Firestore: radarOpenings
             every opening      upsert by company:openingID,     one document per opening,
             this run found     then delete what opened          key company:openingID:timestamp
                                more than 15 days ago

any device ──GET /api/radar──▶ newest first, paged   (the Jobs page's Openings tab reads it too)
```

- **Key** `company:openingID:timestamp`: the company as a slug, the job's own id
  on its board (Greenhouse, Workday, Naukri…, read from its URL by `ids.mjs`),
  and when it opened (epoch ms: the posting date, else the day this PC first saw
  it). The timestamp is fixed when the opening is first stored; later runs find
  it by company:openingID and update it, so nothing is stored twice.
- **Kept 15 days** after it opened. Every POST also deletes older openings and
  run logs (the same as `DELETE /api/radar`).
- **A failed upload** waits in `.radar\pending\` and is sent before the next run's.

### The API (`api/radar.mjs`)

| Call | Token | Does |
|---|---|---|
| `POST /api/radar` | `RADAR_INGEST_TOKEN` | body `{ summary, openings, remove }`: creates new openings, updates known ones, deletes the stored copies of those in `remove` (seen, but now rejected by the rules), then deletes those older than 15 days. Answers `{ created, updated, tooOld, rejected, removed, deleted }` |
| `GET /api/radar` | `RADAR_READ_TOKEN` (or the owner's login) | `?limit=50` (1–200), `?cursor=` (the previous page's `nextCursor`), `?since=2026-10-15`. Answers `{ openings, nextCursor, total, summary }`, newest opening first |
| `DELETE /api/radar` | `RADAR_INGEST_TOKEN` | deletes openings that opened more than 15 days ago; `?days=N` for another age |

Each opening has `id`, `company`, `openingId`, `title`, `location`, `url`,
`source`, `sources`, `postedAt`, `openedAt`, `firstSeen`, `lastSeen`, `active`
(a source listed it in the last week), `exp`, `minYoe`, `maxYoe`, `pay` (`verdict`,
`text`), `matchScore`, `matched`, `missing` and `snippet`.

```bash
curl -H "Authorization: Bearer $RADAR_READ_TOKEN" "https://interviewplanprep.vercel.app/api/radar?limit=50"
```

## Setup (once)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\radar\setup.ps1
```

This creates `.radar\venv` with JobSpy, checks out career-ops in
`.radar\career-ops`, creates `.radar\.env` with two new tokens, and registers the
**CodeNITW Job Radar** task: every day at 06:00, 09:00, 13:00, 16:00 and 22:00
Indian time (pinned to IST, whatever the PC's time zone). If the PC is off at a
run time, it runs once as soon as it's next on; a run never overlaps one still
going. Pass `-Times 07:00,19:00` for other times, `-SkipTask` to skip the task,
`-RemoveTask` to delete it.

The Riley dataset changes once a day, so later runs that day reuse its last
download (`.radar\riley-cache.json`) instead of fetching 70 MB again.

Then add both tokens from `.radar\.env` to the Vercel project's environment
variables under the same names (`RADAR_INGEST_TOKEN`, `RADAR_READ_TOKEN`) and
redeploy. Share only the read token with other devices.

## Running it by hand

```powershell
node scripts\radar\run.mjs                        # full run + upload
node scripts\radar\run.mjs --dry-run              # no upload
node scripts\radar\run.mjs --only=riley,careerops # some sources only (board, riley, jobspy, careerops)
node scripts\radar\run.mjs --days=3               # dataset window (default 7)
```

A run takes about 5–10 minutes. Logs: `.radar\logs\YYYY-MM-DD.log`. What the
last run sent is also in `.radar\openings.json`.
