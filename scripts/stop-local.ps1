param(
  [switch]$StopDatabase
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$RuntimeDir = Join-Path $Root ".motionise-runtime"
$PgData = Join-Path $Root ".motionise-pgdata"

function Find-PgCtl {
  $pgCtl = Get-Command pg_ctl -ErrorAction SilentlyContinue
  if ($pgCtl) { return $pgCtl.Source }

  $roots = @(
    "C:\Program Files\PostgreSQL",
    "C:\Program Files (x86)\PostgreSQL"
  )

  foreach ($root in $roots) {
    if (-not (Test-Path $root)) { continue }
    $matches = Get-ChildItem -LiteralPath $root -Directory |
      Sort-Object Name -Descending |
      ForEach-Object { Join-Path $_.FullName "bin\pg_ctl.exe" } |
      Where-Object { Test-Path $_ }

    if ($matches) { return ($matches | Select-Object -First 1) }
  }

  return $null
}

function Stop-PidFile {
  param([string]$Path)

  if (-not (Test-Path $Path)) { return }

  $pidValue = Get-Content -LiteralPath $Path -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($pidValue) {
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
      taskkill.exe /PID ([int]$pidValue) /T /F *> $null
    } finally {
      $ErrorActionPreference = $oldPreference
    }
    Write-Host "Stopped process tree $pidValue."
  }

  Remove-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
}

function Stop-MotioniseNodeProcesses {
  $rootText = [string]$Root
  $processes = Get-CimInstance Win32_Process |
    Where-Object {
      $_.CommandLine -and
      ($_.Name -eq "node.exe" -or $_.Name -eq "cmd.exe") -and
      ($_.CommandLine.Contains($rootText) -or $_.CommandLine.Contains("src/server.js"))
    }

  foreach ($proc in $processes) {
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
      taskkill.exe /PID $proc.ProcessId /T /F *> $null
    } finally {
      $ErrorActionPreference = $oldPreference
    }
    Write-Host "Stopped Motionise process tree $($proc.ProcessId)."
  }
}

Stop-PidFile (Join-Path $RuntimeDir "backend.pid")
Stop-PidFile (Join-Path $RuntimeDir "frontend.pid")
Stop-MotioniseNodeProcesses

if ($StopDatabase -and (Test-Path $PgData)) {
  $PgCtl = Find-PgCtl
  if ($PgCtl) {
    & $PgCtl -D $PgData stop -m fast
    Write-Host "Stopped Motionise Postgres."
  }
}

Write-Host "Motionise local dev processes stopped."
