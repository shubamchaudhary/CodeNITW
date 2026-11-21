# Naukri Refresher

Keeps a Naukri profile "updated today" by toggling **one trailing `.`** on the resume headline about once an hour, 07:00–19:00 IST. Each run lands at a random moment within ±7.5 min of the hour (e.g. 07:06, then 07:58, then 09:03…). Works in **Chrome, Edge and Firefox**. Each browser keeps its own settings, so one browser can refresh one Naukri account and another browser a second account.

It also has a **job finder** (off until you switch it on): every day around 17:00 IST it reads every Naukri listing of the last 48 hours for your two Naukri accounts, Backend (Java/Spring Boot) and AI (Python and GenAI), one list each. An LLM on Groq rates the best of them against your resume, and your site's Openings tab shows the top 100 per list. See [Job finder](#job-finder) below.

## Install

**Edge**: open `edge://extensions` → turn on **Developer mode** (left sidebar) → **Load unpacked** → pick this `naukri-refresher` folder.

**Chrome**: open `chrome://extensions` → turn on **Developer mode** (top right) → **Load unpacked** → pick this folder.

**Firefox** (optional): open `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** → pick `manifest.json` in this folder. Firefox removes temporary add-ons when it restarts, so repeat this after every Firefox restart. For a permanent install, sign it once as an unlisted add-on with your own addons.mozilla.org account (`npx web-ext sign --channel=unlisted`).

Pin the icon to the toolbar so you can see its badge.

## Start it (once per browser)

1. Log in to naukri.com in that browser with the account it should refresh.
2. Click the extension icon → **Check connection** (optional). This only reads your profile and changes nothing. It shows `Connected as <name>`.
3. Press **Refresh now** and look at your Naukri profile: the headline gains a trailing `.`, it says "updated today", and nothing else changes. The extension checks this itself too.
4. When that first save is verified, the status turns to **On · next 07:06 IST** and it runs by itself every hour.

Nothing is saved automatically until you have done step 3 once, so the first real save always happens while you watch. Right before that first save it keeps a **full backup of your profile** (exactly as Naukri returned it). Open it from the popup's *Profile backup* row to view it, download it as JSON, or delete it. The backup stays in that browser only.

You can keep a Naukri tab open (it will be used), but you don't have to: if none is open, a muted background tab opens for a few seconds and closes again.

## Sleeping tabs, sleeping laptop

- **Your Naukri tab may sleep.** If Edge or Chrome puts it to sleep (discards or freezes it), the extension leaves it alone and does the save in a temporary background tab instead. Both cases are covered by the tests.
- **The laptop must not sleep.** A sleeping PC runs nothing, and a browser can't wake it. In Chrome and Edge, **Keep laptop awake** (on by default) stops Windows from idle-sleeping while auto-refresh is on. The screen still turns off, you can still sleep the PC yourself, and it lets go as soon as auto-refresh is off or paused. Firefox has no such switch, so set Windows to never sleep while plugged in.
- **Heat:** awake with the screen off is close to idle (a few watts). The extension itself works for a few seconds an hour. Close heavy tabs (video, games) before leaving it overnight.
- If the PC does sleep through a slot, that slot is skipped (shown in Activity) rather than run late, and it carries on after the PC wakes.

## What the popup shows

- **Headline now**: the start and end of your headline exactly as Naukri last returned it, with a trailing `.` in orange (or "no dot"). It flips every hour, so you can compare it with your Naukri profile at any time.
- **Today / Yesterday**: every run, newest first. Yesterday stays until the next day starts (IST), then rolls off.
  - `✓ added "."` / `✓ removed "."`: saved, then **re-read from Naukri** and the change was there. The time on the right is Naukri's own last-modified time when its response includes one, otherwise "confirmed".
  - `? … not confirmed`: Naukri accepted the save, but re-reading it failed.
  - `✗`: a failed run (with its retry time). `–`: skipped (PC asleep, daily cap). `!`: paused.
- **Details** (folded): the technical log and the profile backup.

## Badge

| Badge | Meaning |
|---|---|
| *(none)* | On; hover to see the next run |
| `?` | Waiting for your first **Refresh now** |
| `…` | Refreshing right now |
| `off` | Switched off |
| `!` | Paused; open the popup to see why, fix it, press **Resume** |

## Safety rails

- **Only ever edits one trailing dot.** The original headline is remembered, so it alternates exactly between `headline` and `headline.` (a `...` ending can't erode). If you edit the headline yourself, your new text becomes the original. It refuses to save if the headline is empty or already 250/250 characters.
- **Every save is read back.** If the headline didn't change, or **any other profile field became empty**, it pauses immediately and tells you. A backup from before the first save is kept for exactly that case.
- **Requests come from inside a naukri.com page**: the same same-origin calls, cookies and login as the site itself. No password is ever stored. Nothing about your profile is sent anywhere except naukri.com. The job finder sends public job listings, only to your own site; its AI rating sends each JD and your resume text (no name or contacts) to Groq, with your keys.
- **Limits:** at most one save per hourly slot plus 3 manual saves a day (16 for 07–19, 18 for 06–20); scheduled runs skip if a save happened in the last 20 min; "Refresh now" has a 1-minute cooldown; only one run at a time.
- **Failures:** network or server errors retry up to 3 times, 2–5 min apart, within the slot. On HTTP 429 (too many requests) it rests for 2 hours. On logout or an unexpected API response it **pauses** and shows a desktop notification instead of retrying blindly.
- **Self-healing schedule:** a 1-minute watchdog alarm plus saved state, so a restarted browser, a stopped background worker or a lost alarm can't silently stop it.
- **Permissions:** `alarms`, `storage`, `unlimitedStorage` (the JDs waiting for a rating), `scripting`, `notifications`, `power` (keep-awake), access to `www.naukri.com`, to `interviewplanprep.vercel.app` (the job finder's uploads) and to `api.groq.com` (the AI rating). Two small scripts run on pages:
  - `capture.js` runs on Naukri's job search pages and job pages only. It's read-only and keeps a copy of the results and job details the page loads.
  - `site-bridge.js` runs on your own site only. It lets your Job tracker page hand the finder its token. It can only ask the extension two things (is there a finder here, and take this token), and it never reads the page.

Automating your profile may be against Naukri's terms. The schedule is deliberately human-paced, but the risk isn't zero.

## Job finder

Every day around 17:00 IST (±7 min), it opens Naukri's own job search pages (posted in the last 3 days, 2 years of experience) in a muted background tab, one after another, and reads the results each page loads for itself.
- **Every listing, not a sample:** it reads every page of every search, one page of each search in turn, so wherever a run stops each search had its share. A run works in stretches of up to an hour with 10-minute rests (up to 6 stretches) until every search has been read to the end; where it stops (the day's caps, a check from Naukri), the next run carries on. The settings page shows how far the sweep has got.
- **No job twice:** a listing it judged in the last 3 days, kept or not, is skipped by its id: no JD is opened twice, and nothing is sent or rated twice. Each day's run reads the search pages again (Naukri's freshest filter is a whole day, so a narrower one could miss a job posted just before the last run) and only judges what's new.
- **Start over** (finder settings): your site deletes every job the finder put there, on both lists (the radar's own openings stay); this browser forgets everything it read and reads every listing of the last 48 hours again, right away, until done. Your other browser starts over at its next run: your site keeps the time, and each run asks. Ratings from the last 3 days are kept.
- **The JD:** for every card that looks right, it opens that job's page and reads the JD the same way.
- **Read-only:** it never clicks anything and never applies.

The jobs whose JD matches you go to your site's **Openings → ⭐ Naukri, last 48 hours**, as two lists, one per Naukri account:

- **Backend:** Java/Spring Boot roles. Some frontend or AI next to the Java core is fine.
- **AI:** Python and GenAI roles: LLMs, RAG, agents, LangChain, LangGraph, FastAPI, with some backend.

Frontend-only and MERN/MEAN roles, and roles whose main stack is another language (Go, .NET, PHP…), are on neither list. A job is on one list only, so you never apply to it from both accounts. Which list a job goes on depends on the job alone, never on which search found it.

The parser's top 400 per list (last 48 hours, by JD match) go to your site, and an LLM on Groq rates each one 1–100 against your resume (step 3). Each list shows its **top 100** that you haven't taken yet, **highest rating first**; jobs not rated yet come after them, by JD match. "Taken" means applied, in your pipeline, skipped or dismissed. Open one, apply on Naukri from the account it names, and press **Applied**: it goes into your pipeline as applied today and leaves the list.

**Step 1, the card.** A detail the card leaves out never drops a job; only a detail it states can.

| Check | Passes when |
|---|---|
| Posted | in the last 48 hours, as Naukri labels it ("Just now", "Few hours ago", "1 day ago"). "2 days ago" and older are out. No label: Naukri's own posting time decides; neither: passes |
| Applied | not one you've already applied to on Naukri: the card's own data, and then the job's page (Naukri's data, or its apply button saying "Applied") |
| Company | not on the low-pay list: India's IT services, consulting, outsourcing and engineering-services firms (Accenture, TCS, Infosys, Wipro, Cognizant, Capgemini, HCLTech, Tech Mahindra, LTIMindtree, Deloitte, EY…, 69 names in `low-pay.js`, shared with the PC radar and the Openings tab). A few are left off on purpose because they can reach 25 LPA (NTT DATA, Persistent Systems, CGI, IBM's and Fujitsu's labs…). The settings page can replace the list in a browser, one company per line; a name matches whole words of the company's name |
| Title | not a stack or level you don't do: Android, iOS/mobile, .NET, PHP, frontend-only, MERN/MEAN, QA/testing, DevOps/SRE, data, SAP/Salesforce-type platforms, embedded, C/C++ systems work, support, lead/architect/manager, intern. A plain "Software Engineer/Developer" or "Full Stack Developer" passes and its JD decides. A title whose stacks are all outside Java and Python (Node.js, React + Node, Go, Scala…) is out |
| Experience | asks for under 2.5 years, and isn't a 0–1 year fresher role. Not stated: passes |
| Pay | reaches 15 LPA when the listing gives a salary (one the employer hid still counts when Naukri's data has it). Not given: passes |
| Skill chips | when they name 3 or more known technologies and under 40% are yours, the job is another stack and its page isn't opened. Chips that are all JavaScript (React, Node, MongoDB, Express) or all another language's stack, with no Java, Python or GenAI among them, aren't opened either. Chips that aren't technologies ("Strategic", "Compliance") are ignored |

**Step 2, the JD.**
- **Finding the skills:** the finder opens the job's page and finds every technology the JD asks for with the skills dictionary (`skills-dict.js`, over a thousand skills: languages, frameworks, databases, messaging, cloud, DevOps, data, ML, GenAI, testing, security, system design…). It also reads Naukri's "Key Skills" on that page.
- **Matching:** every technology counts, backend and AI alike, against your skills. The job is kept when at least **60%** of them are yours. You can change that bar in the finder's settings.
- **Its main stack decides the list:** the JD's technologies are weighed by stack (Java with Spring and the JVM frameworks; Python with FastAPI, Django and Flask; GenAI; JavaScript with React, Angular, Node and the rest of the frontend; any other language). Java ahead of Python and GenAI: **Backend**. Python and GenAI ahead: **AI**, when there's GenAI work or FastAPI in it (a plain Django or Flask job is neither). JavaScript or another language ahead of both: out ("frontend or MERN stack", "C# stack"…). A JD naming no stack at all is kept as before, ranked last.
- **Taken off your site:** a job your site already has that the rules now turn down (new rules, a company you add to the low-pay list) is removed at the next upload, the finder's own jobs only.
- **What doesn't count:** "nice to have" and "is a plus" lines, company blurbs and perks.
- **JDs that say little:** a JD naming fewer than 4 technologies is held to the same bar and ranked a little lower. One naming none at all is kept, since there's nothing to judge.
- **Unreadable job pages:** the job is judged on its card's chips, and only when they say enough. After 3 unreadable pages in a row, the run stops opening job pages and says so.

**Step 3, the AI rating (Groq).** The parser's top 400 per list (last 48 hours, by JD match) go to your site. Each of them is then read by an LLM on Groq against your resume: the SDE one for the Backend list, the GenAI one for the AI list.
- **The model never gives the number.** It lists the JD's requirements (at most 10), marks each one met, partly met or not met with a short quote from your resume as proof, and names the role, the level and the years the JD asks for. The rating is worked out in `rate-lib.js` with fixed weights: must-haves met 50, nice-to-haves met 10, years asked 15, role 15, level 10.
- **Only proven claims count.** A requirement that isn't in the JD is dropped. A "met" whose quote isn't in your resume, word for word, counts as not met.
- **Caps.** QA, support or mobile roles are rated 20 at most. Lead roles, or 5+ years asked, 30 at most. A JD naming fewer than 3 requirements, 75 at most.
- **When it runs.** Alongside each finder run (three calls at a time, best JD match first), and for up to 10 more minutes after the sweep. **Rate waiting jobs now** in the settings rates what's waiting without opening Naukri. Each job goes to your site again with its rating.
- **Limits.** Up to 300 jobs per list a day by default (the settings change it). A rating is kept 3 days, so a job seen again isn't rated twice; a changed resume means rated again.
- **Keys.** Paste your Groq keys in the finder's settings, comma-separated (`key1,key2,key3`), as many as you have, up to 10: it uses every key you give it, 5 or 10. It uses the same API and key rotation as DeepLogLens: each call takes the next key in turn. A key Groq says is at its limit rests until Groq says it may go again (`retry-after`, or its remaining tokens per minute). A key Groq rejects is left out, after one call. If every key is rejected, the rating pauses and says so, and new keys resume it.
- **Model.** `openai/gpt-oss-20b`, with strict JSON. DeepLogLens's Ask uses `openai/gpt-oss-120b`, and Groq's free limits are per model and per account (8K tokens a minute and 200K a day for these models), so the finder never eats the demo's quota. Groq caches the part of each prompt that repeats (the rules and your resume) and doesn't count cached tokens against the limits.
- **Your resume.** It comes from `resume.local.json` next to this file, which `naukri-refresher-dev/make-job-profile.mjs` writes from your resume PDFs, without your name and contact lines. Git ignores it. Run the script again after a resume changes, then reload the extension.
- **Privacy.** The keys stay in this browser and go only to api.groq.com; the settings page shows the last 4 characters of each. Groq receives your resume text (no name or contacts) and each JD.

Why 60%: on 643 real engineering JDs from public job boards, strong backend fits scored 60–80%, because nearly every JD also names something you don't list (Go, GCP, MySQL…). The share decides only whether a job is kept; within a list, jobs are ranked 0–100 on JD match, title, experience, pay, AmbitionBox rating and how fresh they are. Run over those 643 JDs as if they were Naukri jobs, 209 passed the title rules and 67 were kept (44 backend, 23 AI). The JD step turned down 142.

**Your skills** are everything the dictionary finds in your two resumes (they're nearly the same), plus `radar/skills.json`'s extras, plus what those imply: Spring Boot means Spring and Java, Hibernate means JPA and JDBC. Run `naukri-refresher-dev/make-job-profile.mjs` after a resume changes to regenerate `job-profile.js`. You can add more skills in the finder's settings. `naukri-refresher-dev/skills-coverage.mjs` checks the dictionary against a set of JDs and lists the tech words it missed.

**Two accounts, two browsers.** Popup → Job finder → **Searches for**:
- Pick **Backend only** in the browser logged in to your Backend Naukri account, and **AI only** in the other. Each account then reads only its own searches, which is half the pages each.
- Wherever a job is found, it still lands on the list it fits.
- With one browser, keep **Backend + AI**.

On your site, the ⭐ Naukri view opens on the list this browser searches for. It warns you when you look at the other account's list.

**Set it up (once per browser):**
1. Deploy the site changes (`api/radar.mjs`, the Job tracker and the Openings tab). Until then the finder can't connect or upload.
2. Reload the extension. In Firefox, press **Allow access** in the popup's job finder row.
3. Connect it: in that browser, open your site's **Job tracker** while signed in to it (the popup's **Connect to your site** button opens it). The page hands the extension a token of its own and shows "Job finder connected in this browser". There's nothing to copy.
   - That token can only send job finder openings.
   - It's derived from `RADAR_INGEST_TOKEN`, so a new ingest token disconnects every finder until you open the site again.
   - Pasting `RADAR_INGEST_TOKEN` in Settings → *Paste a token instead* still works.
4. Pick **Searches for**, press **Find jobs now** and watch the first run, then check **Openings → ⭐ Naukri, last 48 hours**. The first run can take a few hours (in stretches), since it reads every page of every search and each good-looking job's JD; later daily runs only open what's new. What it keeps reaches your site every few minutes. Switch it on in the popup when it looks right.
   - For the AI rating: run `node extensions/naukri-refresher-dev/make-job-profile.mjs` once (it writes `resume.local.json`), reload the extension, then paste your Groq keys in the finder's settings → **Save keys** (Firefox asks to allow api.groq.com) → **Check keys**. Jobs kept before that wait, and **Rate waiting jobs now** rates them.
5. Once it works, add `RADAR_NAUKRI=off` to `.radar\.env` so the radar's JobSpy stops searching Naukri from a script. JobSpy runs got "recaptcha required" from Naukri, and the browser does this better.

**Safety.**
- **Pace:** one run at a time, 4–9 s between pages.
- **Caps:** a stretch stops after an hour or 500 pages, then rests 10 minutes; a run has at most 6 stretches. A browser reads at most 3,000 pages a day (search pages and job pages together), 1,500 of them job pages. One search is read up to 100 pages deep (2,000 results).
- **The sweep:** a search is read to the end, until Naukri's own total is reached, a page comes back empty, or the same page comes back again. Where a run stops, the next one carries on, and job pages a run didn't get to are read first.
- **No re-reading:** a job judged in the last 3 days isn't judged or opened again. "Re-scan" (after you change skills or the bar) forgets those verdicts, and so does an update that changes the rules; your site keeps its jobs until a rule turns one down. "Start over" also deletes them from your site.
- **Pausing:** it pauses at once, with a notification, when Naukri shows an "are you human?" check (on a search page or a job page), a login page, an error, or search pages it can't read. It never retries into a block. Finish any check yourself in that browser, then press **Resume**.
- **Settings page:** it lists why jobs were left out, chips it didn't recognize, recent runs, and the last search page and job page it read, for fixing the finder if Naukri changes its pages.
- **Terms:** reading Naukri automatically may be against its terms. The pace is a person's, but reading every listing is far more pages than a person reads (a daily run of up to a few hours), so Naukri is more likely to show a check. The finder then pauses until you finish it and press Resume.

## Tests

```
node --test extensions/naukri-refresher-dev/
node extensions/naukri-refresher-dev/e2e.mjs            # chrome edge firefox, or name one
```

The end-to-end test loads this exact folder into headless Chrome, Edge and Firefox with throwaway profiles and audio muted. It points `www.naukri.com` (and the site's `/api/radar`) at a local mock and covers the scheduling, refresh, retry, back-off, logout, API-change, backup, keep-awake, sleeping-tab and safety paths. For the job finder it also covers:
- **Connecting:** your site's real Job tracker handover code (`src/pages/JobTracker/finderBridge.js`) connecting the finder. Someone else signed in gets nothing, and a token the site rejects is refused.
- **Reading and lists:** search pages read through both fetch and XHR, an exact keep/drop list, the two lists, duplicates, later runs, and a browser set to AI only.
- **JDs:** job pages opened only for cards that pass. A job with filler chips but a Java JD is kept, one with fine chips but a .NET JD is dropped, nice-to-haves and the company blurb don't count, and an unreadable page falls back to its card.
- **Stopping:** the "are you human?" pause on a search page and on a job page (that job is read first after Resume), and a site that isn't updated yet.
- **Your spec:** a low-pay company and MERN chips are dropped on the card, a plain Software Engineer card with a MERN JD is opened and dropped, a Java full-stack job lands on Backend, and a Python/FastAPI/GenAI one on AI.
- **Daily runs and Start over:** one run a day around 17:00 IST; a later run skips every job it already judged (no JD opened again, nothing sent again); Start over asks the site to delete the finder's jobs and reads and sends every listing again; a Start over in the other browser is seen at the next run, which starts over too.
- **The AI rating, on a fake api.groq.com:** jobs kept before any key wait; saved keys (one rejected, one at its limit, one good) rate them; only proven claims count (a planted fake quote and an invented requirement); the ratings reach the site; every key rejected pauses the rating while jobs are still sent; a company added to the low-pay list comes off the site; a job rated in the last 3 days isn't rated again.

`rate.test.mjs` checks the rating's rules and its Groq client against a fake `fetch`: the weights and caps, the quote and requirement checks, the resume sent without contact lines, the request shape, Groq's error answers, the key rotation, and the worker's daily caps. `site-api.test.mjs` checks the site API's token rules (what the finder's token may do, and that pairing works only for the owner), the snapshot over several documents, a finder upload worked out from the snapshot (updates, new openings, pruning, removals of its own jobs only), and the gzipped answer. `skills-dict.test.mjs` checks the dictionary: spellings, words that are also plain English ("react", "rest", "less"), names that need context (Go, C, R), and your skills.

## The Naukri API

The endpoint and header constants are at the top of `lib.js`. They follow the calls the profile page makes. **They worked against the live site on 20 Nov 2026:** on the first real save, the profile read, the headline save and the read-back all succeeded, and no other field was touched. The first save on each new browser or account is still supervised and backed up.

If Naukri changes the API, it shows up as **Paused: …changed shape** or **…failed with HTTP 4xx**. It never keeps saving blindly.
