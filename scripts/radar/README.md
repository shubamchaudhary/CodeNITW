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
| Indian job boards | Naukri (7 cities), Indeed India, Glassdoor India | [JobSpy](https://github.com/speedyapply/JobSpy) in a local Python venv. `RADAR_NAUKRI=off` in `.radar\.env` leaves Naukri to the browser job finder (below) |
| Naukri, the last 48 hours per account (Apply on Naukri: top 100 a list; Apply on company site: all; highest AI rating first) | the Naukri Refresher extension's **job finder** (`extensions/naukri-refresher`), in your logged-in browser(s): it reads every page of every search, then each good-looking job's JD, and keeps it when enough of the technologies it asks for are yours; a Backend list (Java/Spring Boot) and an AI list (Python and GenAI), no low-pay IT services firms; its best 400 a list are rated 1–100 against your resume by an LLM on Groq | it POSTs to the same `/api/radar` with `finder: "naukri"`, using a token your site's Job tracker hands it; the Openings tab shows them under **⭐ Naukri, last 48 hours**. Its openings are kept 3 days, and radar runs never delete or overwrite them. Each job shows in one view only: **📡 All openings** leaves out the ⭐ Naukri jobs, the finder's older Naukri-only jobs, and any other copy of a ⭐ Naukri job (matched by Naukri id, link, or company and title: `src/pages/JobTracker/jobKeys.js`); a repost shows once, and a job in your pipeline under the same company and title stays out of both |
| career-ops | employers on hiring systems the others can't read (IBM, Oracle, Qualcomm…; edit `career-ops-companies.yml`) | [career-ops](https://github.com/career-ops-hq/career-ops)' scanner, checked out at a pinned commit in `.radar/career-ops` |
| LinkedIn | off by default | `--linkedin` turns on the old guest-page sweep; LinkedIn rate-limits it by IP |

## Your resume drives the keywords

Each run reads your resume PDFs, one per kind of role you apply to
(`RESUME_PDF` in `.radar\.env`, several joined with `;`; default
`Downloads\SHUBAM_CHAUDHARY_RESUME_SDE.pdf` and
`Downloads\SHUBAM_CHAUDHARY_RESUME_GENAI.pdf`) with `pdftotext` (it comes with
Git for Windows), and merges them:

- **Search terms** for Naukri, Indeed and Glassdoor come from each headline
  and first language with its framework, taken in turn, up to six (today:
  "java spring boot developer", "python fastapi developer", "backend engineer
  java", "backend engineer python", "software engineer distributed systems",
  "software engineer genai").
- **career-ops' title filter** uses the headlines' roles and focus areas, plus
  AI titles (AI engineer, GenAI, LLM, applied AI…) when a resume leads with GenAI.
- **The skills match** scores each opening against the skills either resume
  names, plus the extras and "want" list in `radar/skills.json`. Each opening
  also lists the skills it asks for that neither resume mentions.

Replace a PDF and the next run picks it up and re-scores everything. The
career-ops checkout also gets the resume as `cv.md`, so its own modes (score
a posting A–H, tailor the CV) work there: open your AI CLI in
`.radar\career-ops`.

## What it keeps

Every job, from any source, goes through the same checks:

1. **Role and place**: a backend/SDE/Java/platform/GenAI title, not senior or lead
   levels, not QA, frontend or mobile, located in India (or remote that includes India).
   **Not a low-pay employer**: India's big IT services, consulting and outsourcing firms
   (Accenture, TCS, Infosys, Wipro, Cognizant, Capgemini, HCLTech, the Big Four…) are dropped,
   and any copy an earlier run stored is deleted. The list is
   `extensions/naukri-refresher/low-pay.js`, shared with the Naukri job finder and the Openings tab
   (which hides anything still stored). A few firms are left off on purpose because they can reach
   25 LPA (NTT DATA, Persistent Systems, CGI, IBM's and Fujitsu's labs…); the file says why.
2. **Experience**: the range of years it asks for, from Naukri's experience
   field, a range in the title, or the job description, must include 2
   (`YOUR_YEARS` in `experience.mjs`). "0–2", "1–3", "2–5" and "1+" stay; "3+"
   and "3–5" ask for more, "0–1" for less, and are dropped. A posting that
   doesn't say is kept, unless its title is senior.
3. **Pay**, with a floor of 18 LPA (`FLOOR_LPA` in `pay.mjs`) and 25 LPA as what you aim for. Two things
   drop a role: the employer's own posted salary topping out under 18L, or (no posted salary) the
   company's India software-engineer top estimate under 18L. Everything else is kept with a label, so no
   role that could pay 25L+ is lost to an average. A company's figures come from the **company pay
   database** first (Firestore `companyPay`, see below), then levels.fyi; what levels.fyi gives, with at
   least 10 reports behind it, is saved there:

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
4. **Skills match** (the JD match bar): a 0–100 score, the share of the technologies its description asks
   for that are yours (see above). Under 60 is dropped when it has a description to judge by (the same
   bar as the Naukri job finder; `RADAR_MIN_MATCH` in `.radar.env` changes it). One with no
   technology in common is dropped whatever the description.
5. **AI rating** (`rate.mjs`, with `GROQ_API_KEYS=key1,key2,…` in `.radar\.env`): the Naukri job
   finder's rating, for the radar's openings. Each one's list comes from its stack (Java backend →
   Backend, Python and GenAI → AI); one in another stack (MERN/Node, .NET, PHP…) is dropped. The rest
   are read once by an LLM on Groq against that list's strict prompt and resume (rules:
   `extensions/naukri-refresher/README.md`, step 3), with the radar's own pay check above standing in
   for the web pay lookup. At most `RADAR_RATE_PER_DAY` calls a
   day (default 400), 20 minutes a run; what's left waits for the next run. The Openings tab sorts by
   the rating. **An opening the LLM rates under 70 is not kept** (`RADAR_MIN_RATING`; it stays on the PC
   with its rating so it isn't rated again, and is deleted from the site); one not rated yet is kept.
   Each card's **Prompt and answer** shows what the model was sent and said. Without keys the radar
   works as before (no rating, so nothing is dropped for it).

   **The company pay database.** What a company pays a software engineer with about 2 years in India is
   kept in Firestore (`companyPay`, one document per company, through `/api/radar`), shared by the radar
   and the Naukri job finder, so no company is worked out twice. The order is always: the database;
   then the internet (levels.fyi for the radar; a Groq web search for the finder); and a figure is saved
   only with enough evidence: sane numbers, and levels.fyi's own with 10+ reports, or two reputable
   sources agreeing (levels.fyi, AmbitionBox, Glassdoor, 6figr, Payscale), or one with 30+ reports
   (`extensions/naukri-refresher/pay-lib.js`, checked again by the API). A figure that isn't sure is
   neither used nor saved. A saved figure is trusted 90 days and never overwritten within 30.

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
| `POST /api/radar` with `finder: "naukri"` | `RADAR_INGEST_TOKEN`, or the finder's own token | the job finder's uploads (`{ finder, summary, openings, remove }`: `remove` takes off its own openings that its rules now turn down; worked out from the snapshot in one transaction, a few document reads each) and its check (`{ finder, check: true }`, writes nothing). The finder's token is derived from the ingest token and can only do these |
| `POST /api/radar` `{ finder: "naukri", pair: true }` | the owner's login (Firebase ID token) | answers `{ ok, finder: true, token }`: the Job tracker page hands that token to the extension (`src/pages/JobTracker/finderBridge.js`) |
| `GET /api/radar` | `RADAR_READ_TOKEN` (or the owner's login) | `?limit=50` (1–200), `?cursor=` (the previous page's `nextCursor`), `?since=2026-10-15`. Answers `{ openings, nextCursor, total, summary, finderSummary, finderRuns }`, newest opening first (`finderRuns`: the finder's latest run per list it searched for) |
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
node scripts\radar\run.mjs --rerate               # rate every opening again (a fresh start for the AI rating)
```

A run takes about 5–10 minutes. Logs: `.radar\logs\YYYY-MM-DD.log`. What the
last run sent is also in `.radar\openings.json`.
