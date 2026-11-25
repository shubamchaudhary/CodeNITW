# Naukri Refresher

Keeps a Naukri profile "updated today" by toggling **one trailing `.`** on the resume headline about once an hour, 07:00–19:00 IST. Each run lands at a random moment within ±7.5 min of the hour (e.g. 07:06, then 07:58, then 09:03…). Works in **Chrome, Edge and Firefox**. Each browser keeps its own settings, so one browser can refresh one Naukri account and another browser a second account.

It also has a **job finder** (off until you switch it on): every day around 17:00 IST it reads every Naukri listing of the last 48 hours for your two Naukri accounts, Backend (Java/Spring Boot) and AI (Python and GenAI), one list each. Groq scores each eligible, readable listing against both résumé summaries, and your site's Openings tab shows the top 100 per list. See [Job finder](#job-finder) below.

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
- **Requests come from inside a naukri.com page**: the same same-origin calls, cookies and login as the site itself. No password is ever stored. Nothing about your profile is sent anywhere except naukri.com. The job finder sends public job listings, only to your own site; its AI rating sends each JD and the two résumé summaries to Groq, with your keys.
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
- **Start fresh** deletes the openings the Naukri finder uploaded, clears its local decisions and starts a new sweep. The other browser picks up the reset on its next sweep. The daily Groq usage tally still applies.
- **Eligibility** uses Naukri’s posting date and experience range. The listing must be under 48 hours old, with a stated minimum below 2.5 years and an upper end that reaches 2 years. Missing experience goes to Groq. The finder skips closed jobs, applied jobs and duplicate IDs.
- **Scoring** uses one Groq request per readable eligible job. The model receives the duties, listed skills, experience, disclosed salary and both compact résumé summaries. It selects Java/Spring Boot backend, hands-on GenAI development or neither and returns a score from 1 to 100. Frontend work can be secondary. Frontend-first and MERN roles belong in neither profile. A disclosed range reaching 18 LPA is negotiable, 20 LPA meets the target and 25 LPA is preferred. Undisclosed salary stays unknown.
- **Evidence** for a recommendation includes a quote from the JD and a quote from the chosen résumé summary. The extension checks both and queues invalid responses for retry. Job finder → Open the report shows every recent decision, pending JDs, and the exact prompt and answer for scored jobs. The settings page shows the scoring instructions and summaries.
- **Tracker** shows available jobs from the last 48 hours scoring at least 70 in their assigned profile. Use **Review other candidates** for lower scores on that profile, and the extension report for unrelated jobs. The Naukri apply section shows the top 100 and the company-site section shows all matching jobs. The finder only reads Naukri.
- **Capacity** depends on the model, account quotas, tokens per JD and the browser’s daily call setting (default 750). Keys take turns and respect rate limits. Jobs accepted into the queue wait across runs and quota resets. An unreadable JD waits for a later sweep. Scoring continues independently of search when a temporary limit lifts.
- **Privacy**. The keys stay in this browser. Full local résumé sources are used to build summaries. The local audit keeps the exact scoring prompt and answer. Tracker cards receive a copy of the prompt with the summaries replaced by placeholders.

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
4. Pick **Searches for**, press **Find jobs now** and watch the first run, then check **Openings → ⭐ Naukri, last 48 hours**. The first run can take a few hours (in stretches), since it reads every page of every search and each eligible job's JD; later daily runs only open what's new. What it keeps reaches your site every few minutes. Switch it on in the popup when it looks right.
   - For the AI rating: run `node extensions/naukri-refresher-dev/make-job-profile.mjs` once (it writes `resume.local.json`), reload the extension, then paste your Groq keys in the finder's settings → **Save keys** (Firefox asks to allow api.groq.com) → **Check keys**. Eligible jobs found before that wait, and **Rate waiting jobs now** rates them.
5. Once it works, add `RADAR_NAUKRI=off` to `.radar\.env` so the radar's JobSpy stops searching Naukri from a script. JobSpy runs got "recaptcha required" from Naukri, and the browser does this better.

**Safety.**
- **Pace:** one run at a time, 4–9 s between pages.
- **Caps:** a stretch stops after an hour or 500 pages, then rests 10 minutes; a run has at most 6 stretches. A browser reads at most 3,000 pages a day (search pages and job pages together), 1,500 of them job pages. One search is read up to 100 pages deep (2,000 results).
- **The sweep:** a search is read to the end, until Naukri's own total is reached, a page comes back empty, or the same page comes back again. Where a run stops, the next one carries on, and job pages a run didn't get to are read first.
- **Re-scan** restarts discovery and reuses current ratings. Unreadable descriptions stay queued for another attempt.
- **Pausing:** it pauses at once, with a notification, when Naukri shows an "are you human?" check (on a search page or a job page), a login page, an error, or search pages it can't read. It never retries into a block. Finish any check yourself in that browser, then press **Resume**.
- **Settings page:** it lists why jobs were left out, recent runs, and the last search page and job page it read, for fixing the finder if Naukri changes its pages.
- **Terms:** reading Naukri automatically may be against its terms. The pace is a person's, but reading every listing is far more pages than a person reads (a daily run of up to a few hours), so Naukri is more likely to show a check. The finder then pauses until you finish it and press Resume.

## Instahyre apply

Two buttons (in the popup, and on the **Instahyre apply** page: popup → Details): **Apply: Java backend** and **Apply: GenAI**. Each opens your saved Instahyre search in a visible tab (the filters, skills and experience, are in the link) and goes through the list one job at a time: open it, read it, apply, pause 2.5–6.5 s, next. When the page has "Load more" it presses it; when the list is used up it looks again (applied jobs leave the list); it stops when the list is finished, at your caps, or on **Stop**.

- **Saved searches.** Java backend defaults to Java and Spring Boot with experience set to All. GenAI uses its own link. Paste the address from the Search Results tab to change either search. When Instahyre redirects to Recommended jobs, the extension restores the skill chips and experience using the page controls and presses Search. It checks the resulting list and filters before opening a job and before pressing Apply. If another saved filter is lost, the run stops and reports the problem in Details.
- **What it applies to.** Everything the search shows (your default). Tick "Skip jobs that aren't for you" on the page to skip: IT-services and consulting firms (the job finder's list), titles that aren't software engineering (QA, support, frontend-only, lead or senior…: the finder's title rules), and jobs asking for **3 or more years**, from the experience badge or the description's overall ask ("4-8 years of overall software engineering experience"; "5+ years with Kubernetes is a plus" doesn't count). A skipped job is only left alone: it is **never marked "Not interested"**.
- **Caps.** 100 applications a run and 200 a day (the page changes them; the day is the job tracker's, 4am to 4am IST).
- **It stops, and says why,** when Instahyre asks you to log in or for a check, says the apply limit is reached, or wants more than a click for a job (a question or form: finish that one by hand, then start again); when a job won't open; or when you close the tab.
- **Dry run.** Opens and reads every job and lists what it would do, pressing no Apply. **Try this first:** the page is read by its visible text ("View job", "Apply", "Not interested", "Load more"), not tested against the real site (it needs your login), only against a fake one made from your screenshots.
- It only runs when you press a button. Automating applications may be against Instahyre's terms; the pace is deliberately human, and the caps are there so a run can't apply to hundreds of jobs by accident.

## Tests

```
node --test extensions/naukri-refresher-dev/
node extensions/naukri-refresher-dev/e2e.mjs            # chrome edge firefox, or name one
```

The end-to-end test loads this exact folder into headless Chrome, Edge and Firefox with throwaway profiles and audio muted. It points `www.naukri.com` (and the site's `/api/radar`) at a local mock and covers the scheduling, refresh, retry, back-off, logout, API-change, backup, keep-awake, sleeping-tab and safety paths. For the job finder it also covers:
- **Connecting:** your site's real Job tracker handover code (`src/pages/JobTracker/finderBridge.js`) connecting the finder. Someone else signed in gets nothing, and a token the site rejects is refused.
- Search via fetch and XHR, pagination, age and experience eligibility, duplicate IDs, closed or applied jobs, and an unreadable description retried on the next sweep.
- Scoring with mock Groq keys, cross-profile routing, salary limits, local prompts for accepted and rejected jobs, and queue persistence through key failures.
- Daily scheduling, scoped searches, resetting the Naukri openings and recovering after a tab closes.

`rate.test.mjs` checks the rating's rules and its Groq client against a fake `fetch`: the weights and caps, the quote and requirement checks, the resume sent without contact lines, the request shape, Groq's error answers, the key rotation, and the worker's daily caps. `site-api.test.mjs` checks the site API's token rules (what the finder's token may do, and that pairing works only for the owner), the snapshot over several documents, a finder upload worked out from the snapshot (updates, new openings, pruning, removals of its own jobs only), and the gzipped answer. `skills-dict.test.mjs` checks the dictionary: spellings, words that are also plain English ("react", "rest", "less"), names that need context (Go, C, R), and your skills.

## The Naukri API

The endpoint and header constants are at the top of `lib.js`. They follow the calls the profile page makes. **They worked against the live site on 20 Nov 2026:** on the first real save, the profile read, the headline save and the read-back all succeeded, and no other field was touched. The first save on each new browser or account is still supervised and backed up.

If Naukri changes the API, it shows up as **Paused: …changed shape** or **…failed with HTTP 4xx**. It never keeps saving blindly.
