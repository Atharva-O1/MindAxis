# MindAxis one-time setup script (Windows).
#
# Installs everything needed to run the app locally: Git, Node.js, Python,
# PostgreSQL, Ollama - then sets up the project itself (npm install, Python
# venv, database role/db, backend/.env, the AI model). Safe to re-run: every
# step checks whether it's already done before doing it again.
#
# Run from an elevated PowerShell ("Run as Administrator") for best results -
# winget installs and the firewall step need it. If you're not elevated,
# most steps still work; you'll see a note for anything that was skipped.

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Skip($msg) { Write-Host "    already done - $msg" -ForegroundColor DarkGray }
function Write-Warn($msg) { Write-Host "    WARNING: $msg" -ForegroundColor Yellow }

function Test-Cmd($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

function Install-WingetPackage($id, $label) {
    Write-Host "    installing $label ($id)..."
    winget install --id $id -e --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "$label install reported a non-zero exit code - check the output above."
    }
}

function New-RandomToken($length) {
    -join ((48..57) + (65..90) + (97..122) | Get-Random -Count $length | ForEach-Object { [char]$_ })
}

# ---------------------------------------------------------------------------

Write-Step "Checking for winget"
if (-not (Test-Cmd winget)) {
    Write-Host "winget isn't available. Install 'App Installer' from the Microsoft Store, then re-run this script." -ForegroundColor Red
    exit 1
}

Write-Step "Git"
if (Test-Cmd git) { Write-Skip "git found" } else { Install-WingetPackage "Git.Git" "Git" }

Write-Step "Node.js (LTS)"
if (Test-Cmd node) { Write-Skip "node found ($(node -v))" } else { Install-WingetPackage "OpenJS.NodeJS.LTS" "Node.js LTS" }

Write-Step "Python"
if (Test-Cmd python) { Write-Skip "python found ($(python --version))" } else { Install-WingetPackage "Python.Python.3.13" "Python 3.13" }

Write-Step "Ollama"
if (Test-Cmd ollama) { Write-Skip "ollama found" } else { Install-WingetPackage "Ollama.Ollama" "Ollama" }

Write-Step "PostgreSQL"
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
$pgSuperPassword = $null
if ($pgService) {
    Write-Skip "PostgreSQL service '$($pgService.Name)' already installed"
} else {
    $pgSuperPassword = New-RandomToken 24
    Write-Host "    installing PostgreSQL 18 (this can take a few minutes)..."
    winget install --id PostgreSQL.PostgreSQL.18 -e --silent --accept-package-agreements --accept-source-agreements `
        --override "--mode unattended --unattendedmodeui none --superpassword $pgSuperPassword --serverport 5432"
    if ($LASTEXITCODE -ne 0) { Write-Warn "PostgreSQL install reported a non-zero exit code - check the output above." }
    Start-Sleep -Seconds 5
}

# Refresh PATH in this session so tools installed just now (node/python/etc.)
# are actually found below without needing a new terminal.
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path", "User")

Write-Step "Frontend dependencies (npm install)"
if (Test-Path "node_modules") {
    Write-Skip "node_modules already exists"
} else {
    if (-not (Test-Cmd npm)) {
        Write-Warn "npm not found in this session's PATH yet. Close this window, open a new PowerShell, and re-run setup.ps1 to continue."
        exit 1
    }
    npm install
}

Write-Step "Backend Python environment"
Set-Location "backend"
if (-not (Test-Path ".venv")) {
    if (-not (Test-Cmd python)) {
        Write-Warn "python not found in this session's PATH yet. Close this window, open a new PowerShell, and re-run setup.ps1 to continue."
        exit 1
    }
    python -m venv .venv
} else {
    Write-Skip ".venv already exists"
}
& ".venv\Scripts\pip.exe" install -r requirements.txt

Write-Step "Database (role + database + backend/.env)"
if (Test-Path ".env") {
    Write-Skip "backend/.env already exists - leaving it as-is (delete it and re-run this script to regenerate)"
} else {
    $pgBin = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $pgBin) {
        Write-Warn "Couldn't find psql.exe under C:\Program Files\PostgreSQL - skipping database setup. Follow backend/README.md manually."
    } else {
        if (-not $pgSuperPassword) {
            $secure = Read-Host "Enter your PostgreSQL 'postgres' superuser password" -AsSecureString
            $pgSuperPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
        }
        $env:PGPASSWORD = $pgSuperPassword

        $roleExists = (& $pgBin.FullName -U postgres -h localhost -p 5432 -tAc "SELECT 1 FROM pg_roles WHERE rolname='mindaxis'" 2>$null)
        if ($roleExists -eq "1") {
            Write-Warn "Postgres role 'mindaxis' already exists but backend/.env doesn't - can't recover its password automatically. Set DATABASE_URL in backend/.env manually (see backend/README.md)."
        } else {
            $mindaxisPassword = New-RandomToken 24
            & $pgBin.FullName -U postgres -h localhost -p 5432 -c "CREATE ROLE mindaxis WITH LOGIN PASSWORD '$mindaxisPassword';" | Out-Null
            & $pgBin.FullName -U postgres -h localhost -p 5432 -c "CREATE DATABASE mindaxis OWNER mindaxis;" | Out-Null

            $jwtSecret = New-RandomToken 48
            @"
OLLAMA_MODEL=qwen2.5-coder:3b
OLLAMA_BASE_URL=http://localhost:11434

DATABASE_URL=postgresql+psycopg://mindaxis:$mindaxisPassword@localhost:5432/mindaxis
JWT_SECRET=$jwtSecret
"@ | Set-Content -Path ".env" -Encoding utf8

            Write-Host "    created Postgres role/database 'mindaxis' and wrote backend/.env"
        }
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    }
}
Set-Location ..

Write-Step "AI model (this is the slow one - a ~2GB download)"
if (-not (Test-Cmd ollama)) {
    Write-Warn "ollama not found in this session's PATH yet. Close this window, open a new PowerShell, and run: ollama pull qwen2.5-coder:3b"
} else {
    ollama pull qwen2.5-coder:3b
}

Write-Step "Firewall (only needed for testing on a physical phone)"
$existingRule = Get-NetFirewallRule -DisplayName "MindAxis backend*" -ErrorAction SilentlyContinue
if ($existingRule) {
    Write-Skip "firewall rule already exists"
} else {
    try {
        New-NetFirewallRule -DisplayName "MindAxis backend (port 8000)" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow -Profile Any -ErrorAction Stop | Out-Null
        Write-Host "    added inbound rule for port 8000"
    } catch {
        Write-Warn "Couldn't add the firewall rule (needs an elevated/Administrator PowerShell). Only matters if you're testing on a physical phone - see backend/README.md."
    }
}

Write-Host "`n=== Setup finished ===" -ForegroundColor Green
Write-Host "If anything above showed a WARNING, read it before continuing." -ForegroundColor Yellow
Write-Host @"

To run the app, open THREE terminals:

  1) ollama serve                                  (skip if already running)
  2) cd backend; .venv\Scripts\activate; uvicorn app.main:app --reload
  3) npm start                                      (then press w for web)

OTP codes print in terminal 2's console - there's no real email sending.
"@
