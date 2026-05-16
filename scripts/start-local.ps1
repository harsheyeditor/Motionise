$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Backend = Join-Path $Root "backend"
$RuntimeDir = Join-Path $Root ".motionise-runtime"
$LogDir = Join-Path $RuntimeDir "logs"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Test-Port {
  param([int]$Port)

  try {
    $client = New-Object Net.Sockets.TcpClient
    $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    $connected = $async.AsyncWaitHandle.WaitOne(500)
    if ($connected) { $client.EndConnect($async) }
    $client.Close()
    return $connected
  } catch {
    return $false
  }
}

if (Test-Port 3001) {
  Write-Host "Backend is already running on port 3001; skipping setup to avoid touching locked Prisma files."
} else {
  & (Join-Path $PSScriptRoot "setup-local.ps1")
}

function Start-LoggedProcess {
  param(
    [string]$Name,
    [string]$WorkingDirectory,
    [string]$Command,
    [string]$LogFile,
    [string]$PidFile
  )

  $cmd = "cd /d `"$WorkingDirectory`" && $Command > `"$LogFile`" 2>&1"
  $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/d", "/c", $cmd -WindowStyle Hidden -PassThru
  Set-Content -LiteralPath $PidFile -Value $proc.Id -Encoding ASCII
  Write-Host "$Name started. Log: $LogFile"
}

$BackendLog = Join-Path $LogDir "backend.log"
$FrontendLog = Join-Path $LogDir "frontend.log"

if (Test-Port 3001) {
  Write-Host "Backend already appears to be running on port 3001."
} else {
  Start-LoggedProcess `
    -Name "Backend" `
    -WorkingDirectory $Backend `
    -Command "npm.cmd run dev" `
    -LogFile $BackendLog `
    -PidFile (Join-Path $RuntimeDir "backend.pid")
}

if (Test-Port 5173) {
  Write-Host "Frontend already appears to be running on port 5173."
} else {
  Start-LoggedProcess `
    -Name "Frontend" `
    -WorkingDirectory $Root `
    -Command "npm.cmd run dev -- --host 127.0.0.1" `
    -LogFile $FrontendLog `
    -PidFile (Join-Path $RuntimeDir "frontend.pid")
}

Write-Host "Waiting for API health..."
for ($i = 0; $i -lt 30; $i++) {
  try {
    Invoke-RestMethod -Uri "http://localhost:3001/api/health" -UseBasicParsing | Out-Null
    break
  } catch {
    Start-Sleep -Seconds 1
  }
}

Write-Host ""
Write-Host "Motionise is starting."
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend:  http://localhost:3001/api/health"
Write-Host "Logs:     $LogDir"
