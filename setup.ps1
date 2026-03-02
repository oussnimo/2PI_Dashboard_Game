# ============================================================
#   2Pi Dashboard - One-Click Setup Script
#   Run this once after cloning from GitHub
#   Usage: Right-click -> "Run with PowerShell"
#          OR in terminal: .\setup.ps1
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   2Pi Dashboard - Automatic Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Step($msg) {
    Write-Host ""
    Write-Host ">> $msg" -ForegroundColor Yellow
}

function Ok($msg) {
    Write-Host "   [OK] $msg" -ForegroundColor Green
}

function Warn($msg) {
    Write-Host "   [WARN] $msg" -ForegroundColor DarkYellow
}

function Fail($msg) {
    Write-Host "" 
    Write-Host "   [ERROR] $msg" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Setup failed. Fix the issue above and re-run .\setup.ps1" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# â”€â”€ PRE-FLIGHT CHECKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Step "Checking required tools are installed..."

# Check PHP
try {
    $phpVersion = & php -r "echo PHP_VERSION;" 2>$null
    if (-not $phpVersion) { throw }
    Ok "PHP found: $phpVersion"
}
catch {
    Fail "PHP not found. Install PHP 8.1+ and make sure it is added to your system PATH.`n   Download: https://www.php.net/downloads"
}

# Check Composer
try {
    $composerVersion = & composer --version 2>$null | Select-Object -First 1
    if (-not $composerVersion) { throw }
    Ok "Composer found: $composerVersion"
}
catch {
    Fail "Composer not found. Install Composer and make sure it is added to your system PATH.`n   Download: https://getcomposer.org/"
}

# Check Node.js
try {
    $nodeVersion = & node --version 2>$null
    if (-not $nodeVersion) { throw }
    Ok "Node.js found: $nodeVersion"
}
catch {
    Fail "Node.js not found. Install Node.js 18+ and make sure it is added to your system PATH.`n   Download: https://nodejs.org/"
}

# Check npm
try {
    $npmVersion = & npm --version 2>$null
    if (-not $npmVersion) { throw }
    Ok "npm found: v$npmVersion"
}
catch {
    Fail "npm not found. It should come bundled with Node.js. Try reinstalling Node.js."
}

# â”€â”€ Check XAMPP MySQL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Step "Checking MySQL (XAMPP)..."
$mysqlExe = "C:\xampp\mysql\bin\mysql.exe"
if (-not (Test-Path $mysqlExe)) {
    Fail "XAMPP MySQL not found at '$mysqlExe'.`n   Make sure XAMPP is installed at C:\xampp.`n   Download: https://www.apachefriends.org/"
}

# Check MySQL is actually running (not just installed)
$mysqlRunning = $false
try {
    $result = & $mysqlExe -u root --connect-timeout=5 -e "SELECT 1;" 2>$null
    if ($LASTEXITCODE -eq 0) { $mysqlRunning = $true }
}
catch {}

if (-not $mysqlRunning) {
    Fail "MySQL is installed but NOT running.`n   Open the XAMPP Control Panel and click START next to MySQL, then re-run this script."
}
Ok "MySQL is running."

# â”€â”€ Create MySQL Database â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Step "Creating MySQL database '2pi_dashboard'..."
try {
    & $mysqlExe -u root -e "CREATE DATABASE IF NOT EXISTS ``2pi_dashboard`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>$null
    Ok "Database '2pi_dashboard' is ready."
}
catch {
    Fail "Failed to create the database. Make sure MySQL is running and accessible as root without a password."
}

# â”€â”€ BACKEND SETUP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Step "Setting up Backend (Laravel)..."
Set-Location "BackEnd"

# Check BackEnd folder structure is correct
if (-not (Test-Path "artisan")) {
    Set-Location ".."
    Fail "Could not find 'BackEnd\artisan'. Make sure you are running this script from the project root folder."
}

# Copy .env
if (-not (Test-Path ".env")) {
    if (-not (Test-Path ".env.example")) {
        Warn ".env.example not found â€” creating a blank .env. You will need to fill it in manually."
        New-Item -ItemType File -Name ".env" | Out-Null
    }
    else {
        Copy-Item ".env.example" ".env"
        Ok ".env file created from .env.example"
    }
}
else {
    Ok ".env already exists, skipping copy."
}

# Create required Laravel directories (not tracked by Git -- common cause of setup failures)
Step "Creating required Laravel directories..."
$laravelDirs = @(
    "bootstrap\cache",
    "storage\framework\sessions",
    "storage\framework\views",
    "storage\framework\cache\data",
    "storage\logs",
    "storage\app\public"
)
foreach ($dir in $laravelDirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}
Ok "Laravel directories created."

# Composer install
Step "Installing PHP dependencies (composer install)..."
try {
    composer install --no-interaction --prefer-dist
    if ($LASTEXITCODE -ne 0) { throw }
    Ok "PHP dependencies installed."
}
catch {
    Fail "composer install failed. Check the output above for details."
}

# Generate app key
Step "Generating Laravel app key..."
try {
    php artisan key:generate --force
    if ($LASTEXITCODE -ne 0) { throw }
    Ok "App key generated."
}
catch {
    Fail "php artisan key:generate failed.`n   Make sure bootstrap\cache exists and is writable.`n   Try running: mkdir -Force BackEnd\bootstrap\cache"
}

# Run migrations
Step "Running database migrations..."
try {
    php artisan migrate --force
    if ($LASTEXITCODE -ne 0) { throw }
    Ok "Database tables created."
}
catch {
    Fail "php artisan migrate failed.`n   Make sure MySQL is running and the database '2pi_dashboard' exists.`n   Check your BackEnd\.env file: DB_HOST, DB_PORT, DB_USERNAME, DB_DATABASE."
}

Set-Location ".."

# â”€â”€ FRONTEND SETUP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Step "Setting up Frontend (React / Vite)..."
Set-Location "FrontEnd"

# Check FrontEnd folder structure is correct
if (-not (Test-Path "package.json")) {
    Set-Location ".."
    Fail "Could not find 'FrontEnd\package.json'. Make sure you are running this script from the project root folder."
}

# Copy .env
if (-not (Test-Path ".env")) {
    if (-not (Test-Path ".env.example")) {
        Warn ".env.example not found in FrontEnd â€” skipping .env copy."
    }
    else {
        Copy-Item ".env.example" ".env"
        Ok ".env file created from .env.example"
    }
}
else {
    Ok ".env already exists, skipping copy."
}

# npm install
Step "Installing JS dependencies (npm install)..."
try {
    npm install
    if ($LASTEXITCODE -ne 0) { throw }
    Ok "JS dependencies installed."
}
catch {
    Fail "npm install failed. Check the output above for details."
}

Set-Location ".."

# â”€â”€ API KEY REMINDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  IMPORTANT: Add your AI API keys to BackEnd\.env:" -ForegroundColor Magenta
Write-Host "    GEMINI_API_KEY=your_key_here" -ForegroundColor White
Write-Host "    GROQ_API_KEY=your_key_here" -ForegroundColor White
Write-Host ""
Write-Host "  Get keys here:" -ForegroundColor DarkGray
Write-Host "    Gemini -> https://aistudio.google.com/app/apikey" -ForegroundColor DarkGray
Write-Host "    Groq   -> https://console.groq.com/keys" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Now start the servers in two separate terminals:" -ForegroundColor White
Write-Host ""
Write-Host "  Terminal 1 (Backend):" -ForegroundColor Cyan
Write-Host "    cd BackEnd" -ForegroundColor White
Write-Host "    php artisan serve" -ForegroundColor White
Write-Host ""
Write-Host "  Terminal 2 (Frontend):" -ForegroundColor Cyan
Write-Host "    cd FrontEnd" -ForegroundColor White
Write-Host "    npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "  Then open: http://localhost:3000" -ForegroundColor Green
Write-Host ""
