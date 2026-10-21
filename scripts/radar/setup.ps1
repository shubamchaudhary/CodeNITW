# One-time setup for the job radar on this PC (Windows).
#
#   1. Creates .radar\venv with JobSpy (Naukri / Indeed / Glassdoor source).
#   2. Checks out career-ops into .radar\career-ops at a pinned, tested commit
#      (its scanner is a radar source). Change $CareerOpsCommit to update it.
#   3. Creates .radar\.env with the API tokens and resume path, if missing.
#   4. Registers the "CodeNITW Job Radar" scheduled task: every day at each of
#      -Times, Indian time (IST, UTC+05:30, whatever the PC's time zone), and as
#      soon as the PC is next on if it was off then (one catch-up run).
#
# Usage (from the repo root):
#   powershell -ExecutionPolicy Bypass -File scripts\radar\setup.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\radar\setup.ps1 -Times 07:00,19:00
#   powershell -ExecutionPolicy Bypass -File scripts\radar\setup.ps1 -SkipTask
#   powershell -ExecutionPolicy Bypass -File scripts\radar\setup.ps1 -RemoveTask
#
# Never move this to GitHub Actions: the old Actions radar got the GitHub
# account blocked.

param(
  [string[]]$Times = @("06:00", "09:00", "13:00", "16:00", "22:00"),
  [switch]$SkipTask,
  [switch]$RemoveTask
)

$ErrorActionPreference = "Stop"
# Through -File, "-Times 07:00,19:00" arrives as one string.
$Times = @($Times -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_ })
foreach ($t in $Times) {
  if ($t -notmatch '^([01]\d|2[0-3]):[0-5]\d$') { throw "Times must be HH:mm (24-hour), got '$t'" }
}
$TaskName = "CodeNITW Job Radar"
$CareerOpsRepo = "https://github.com/career-ops-hq/career-ops.git"
$CareerOpsCommit = "c87e0f05a5bf3b0e7bff1f6c87fd0865191e7da7" # main on 2026-10-20, tested with the radar
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$State = Join-Path $Root ".radar"

if ($RemoveTask) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Removed the '$TaskName' task."
  exit 0
}

New-Item -ItemType Directory -Force -Path (Join-Path $State "logs") | Out-Null

# 1. Python venv with JobSpy
$Venv = Join-Path $State "venv"
$VenvPy = Join-Path $Venv "Scripts\python.exe"
if (-not (Test-Path $VenvPy)) {
  $py = Get-Command py -ErrorAction SilentlyContinue
  if ($py) { & py -3 -m venv $Venv } else { & python -m venv $Venv }
}
& $VenvPy -m pip install --quiet --upgrade python-jobspy
Write-Host "JobSpy ready in $Venv"

# 2. career-ops at the pinned commit (no install scripts: its scanner needs no browser)
$CareerOps = Join-Path $State "career-ops"
if (-not (Test-Path (Join-Path $CareerOps ".git"))) {
  git init --quiet $CareerOps
  git -C $CareerOps remote add origin $CareerOpsRepo
}
if ((git -C $CareerOps rev-parse --verify --quiet HEAD) -ne $CareerOpsCommit) {
  git -C $CareerOps fetch --quiet --depth 1 origin $CareerOpsCommit
  git -C $CareerOps -c advice.detachedHead=false checkout --quiet --force FETCH_HEAD
  $env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1"
  Push-Location $CareerOps
  npm install --ignore-scripts --no-audit --no-fund --loglevel=error | Out-Null
  Pop-Location
}
Write-Host "career-ops ready in $CareerOps at $($CareerOpsCommit.Substring(0, 7))"

# 3. API tokens and resume path. Two fresh random tokens; copy both into the
#    Vercel project's environment variables under the same names.
function New-Token {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}
$EnvFile = Join-Path $State ".env"
if (-not (Test-Path $EnvFile)) {
  @(
    "# Lets this PC upload (POST/DELETE /api/radar). Set the same value as RADAR_INGEST_TOKEN on Vercel.",
    "RADAR_INGEST_TOKEN=$(New-Token)",
    "# Lets any device read (GET /api/radar). Set the same value as RADAR_READ_TOKEN on Vercel; share only this one.",
    "RADAR_READ_TOKEN=$(New-Token)",
    "# The resume the radar takes its keywords from (this is the default).",
    "# RESUME_PDF=$env:USERPROFILE\Downloads\SHUBAM_CHAUDHARY_RESUME_SDE.pdf",
    "# RADAR_API_URL=https://interviewplanprep.vercel.app/api/radar"
  ) | Set-Content -Path $EnvFile -Encoding UTF8
  Write-Host "Created $EnvFile with two new tokens - add both to the Vercel project's environment variables."
}

# 4. Scheduled task, one daily trigger per time
if (-not $SkipTask) {
  $node = (Get-Command node).Source
  # conhost --headless runs it without opening a console window.
  $action = New-ScheduledTaskAction -Execute "conhost.exe" -Argument "--headless `"$node`" scripts\radar\run.mjs" -WorkingDirectory $Root
  $today = (Get-Date).ToString("yyyy-MM-dd")
  $triggers = foreach ($t in $Times) {
    $trigger = New-ScheduledTaskTrigger -Daily -At $t
    # An explicit +05:30 offset pins the trigger to IST ("synchronize across time zones").
    $trigger.StartBoundary = "$($today)T$($t):00+05:30"
    $trigger
  }
  $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable `
    -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -MultipleInstances IgnoreNew
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $triggers -Settings $settings `
    -Description "Job radar for CodeNITW (scripts/radar/run.mjs), daily at $($Times -join ', ') IST. Logs in .radar\logs." -Force | Out-Null
  Write-Host "Scheduled '$TaskName' daily at $($Times -join ', ') IST (a missed time runs when the PC is next on)."
}
