$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Backend = Join-Path $Root "backend"
$EnvPath = Join-Path $Backend ".env"
$RuntimeDir = Join-Path $Root ".motionise-runtime"
$LogDir = Join-Path $RuntimeDir "logs"
$PgData = Join-Path $Root ".motionise-pgdata"
$PgPort = 5433
$PgUser = "motionise"
$PgDatabase = "motionise"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Find-PostgresBin {
  $initdb = Get-Command initdb -ErrorAction SilentlyContinue
  if ($initdb) { return Split-Path $initdb.Source -Parent }

  $roots = @(
    "C:\Program Files\PostgreSQL",
    "C:\Program Files (x86)\PostgreSQL"
  )

  foreach ($root in $roots) {
    if (-not (Test-Path $root)) { continue }
    $bins = Get-ChildItem -LiteralPath $root -Directory |
      Sort-Object Name -Descending |
      ForEach-Object { Join-Path $_.FullName "bin" } |
      Where-Object { Test-Path (Join-Path $_ "initdb.exe") }

    if ($bins) { return ($bins | Select-Object -First 1) }
  }

  throw "PostgreSQL tools were not found. Install PostgreSQL, then run this script again."
}

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

function Run-Step {
  param(
    [string]$Name,
    [string]$WorkingDirectory,
    [scriptblock]$Command
  )

  Write-Host ""
  Write-Host $Name
  Push-Location $WorkingDirectory
  try {
    & $Command
  } finally {
    Pop-Location
  }
}

$PgBin = Find-PostgresBin
$InitDb = Join-Path $PgBin "initdb.exe"
$PgCtl = Join-Path $PgBin "pg_ctl.exe"
$PgIsReady = Join-Path $PgBin "pg_isready.exe"
$Createdb = Join-Path $PgBin "createdb.exe"
$Psql = Join-Path $PgBin "psql.exe"

Write-Host "Writing backend/.env for the automated local Postgres instance..."
@"
DATABASE_URL="postgresql://${PgUser}@localhost:${PgPort}/${PgDatabase}?schema=public"
PORT=3001
NODE_ENV=development
UPLOADS_DIR=./uploads
"@ | Set-Content -LiteralPath $EnvPath -Encoding ASCII

New-Item -ItemType Directory -Force -Path (Join-Path $Backend "uploads\assets") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Backend "uploads\exports") | Out-Null

if (-not (Test-Path $PgData)) {
  Write-Host "Initializing Motionise Postgres data directory..."
  & $InitDb -D $PgData -U $PgUser -A trust -E UTF8
}

if (-not (Test-Port $PgPort)) {
  Write-Host "Starting Motionise Postgres on port $PgPort..."
  & $PgCtl -D $PgData -l (Join-Path $LogDir "postgres.log") -o "-p $PgPort" start
} else {
  Write-Host "Port $PgPort is already open; assuming Motionise Postgres is running."
}

Write-Host "Waiting for Motionise Postgres..."
for ($i = 0; $i -lt 60; $i++) {
  & $PgIsReady -h localhost -p $PgPort -U $PgUser *> $null
  if ($LASTEXITCODE -eq 0) { break }
  Start-Sleep -Seconds 1
}

& $PgIsReady -h localhost -p $PgPort -U $PgUser
if ($LASTEXITCODE -ne 0) {
  throw "Motionise Postgres did not become ready."
}

$dbExists = & $Psql -h localhost -p $PgPort -U $PgUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$PgDatabase'"
$dbExistsText = if ($null -eq $dbExists) { "" } else { ([string]$dbExists).Trim() }
if ($dbExistsText -ne "1") {
  Write-Host "Creating database '$PgDatabase'..."
  & $Createdb -h localhost -p $PgPort -U $PgUser $PgDatabase
}

if (Test-Port 3001) {
  Write-Host "Backend is already running on port 3001; skipping Prisma generate/migrate/seed."
  Write-Host ""
  Write-Host "Motionise local backend setup is ready."
  Write-Host "Postgres: localhost:$PgPort"
  Write-Host "API:      http://localhost:3001"
  return
}

if (-not (Test-Path (Join-Path $Backend "node_modules"))) {
  Run-Step "Installing backend dependencies..." $Backend { npm.cmd install }
}

Run-Step "Generating Prisma client..." $Backend { npx.cmd prisma generate }
Run-Step "Applying database migrations..." $Backend { npx.cmd prisma migrate dev --name init }
Run-Step "Seeding demo project..." $Backend { npm.cmd run db:seed }

Write-Host ""
Write-Host "Motionise local backend setup is ready."
Write-Host "Postgres: localhost:$PgPort"
Write-Host "API:      http://localhost:3001"
