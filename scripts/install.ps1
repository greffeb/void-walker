# Void Walker Installation Script
# This script sets up the complete development environment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Void Walker Installation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find Python executable (avoiding Windows Store alias)
Write-Host "[1/5] Checking Python installation..." -ForegroundColor Yellow

$pythonCmd = $null

# Try py launcher first (most reliable on Windows)
try {
    $pyVersion = & py -3 --version 2>&1
    if ($pyVersion -match "Python (\d+)\.(\d+)") {
        $major = [int]$Matches[1]
        $minor = [int]$Matches[2]
        if ($major -ge 3 -and $minor -ge 11) {
            $pythonCmd = "py -3"
            Write-Host "  [OK] $pyVersion found (using py launcher)" -ForegroundColor Green
        }
    }
}
catch { }

# If py launcher didn't work, try python3
if (-not $pythonCmd) {
    try {
        $py3Version = & python3 --version 2>&1
        if ($py3Version -match "Python (\d+)\.(\d+)") {
            $major = [int]$Matches[1]
            $minor = [int]$Matches[2]
            if ($major -ge 3 -and $minor -ge 11) {
                $pythonCmd = "python3"
                Write-Host "  [OK] $py3Version found" -ForegroundColor Green
            }
        }
    }
    catch { }
}

# Check common Python installation paths
if (-not $pythonCmd) {
    $commonPaths = @(
        "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
        "C:\Python312\python.exe",
        "C:\Python311\python.exe"
    )
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $testVersion = & $path --version 2>&1
            if ($testVersion -match "Python (\d+)\.(\d+)") {
                $major = [int]$Matches[1]
                $minor = [int]$Matches[2]
                if ($major -ge 3 -and $minor -ge 11) {
                    $pythonCmd = "`"$path`""
                    Write-Host "  [OK] $testVersion found at $path" -ForegroundColor Green
                    break
                }
            }
        }
    }
}

if (-not $pythonCmd) {
    Write-Host "  [ERROR] Python 3.11 or higher is required but not found" -ForegroundColor Red
    Write-Host "  Please install Python 3.11+ from https://www.python.org/downloads/" -ForegroundColor Red
    Write-Host "  Make sure to check 'Add Python to PATH' during installation" -ForegroundColor Yellow
    exit 1
}

# Get the script's directory and navigate to project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
Set-Location $projectRoot
Write-Host "  Working directory: $projectRoot" -ForegroundColor Gray

# Create virtual environment if it doesn't exist
Write-Host ""
Write-Host "[2/5] Setting up virtual environment..." -ForegroundColor Yellow
$venvPath = Join-Path $projectRoot ".venv"
if (Test-Path $venvPath) {
    Write-Host "  [OK] Virtual environment already exists" -ForegroundColor Green
}
else {
    Write-Host "  Creating virtual environment..." -ForegroundColor Gray
    Invoke-Expression "$pythonCmd -m venv .venv"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Virtual environment created" -ForegroundColor Green
    }
    else {
        Write-Host "  [ERROR] Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
}

# Activate virtual environment
Write-Host ""
Write-Host "[3/5] Activating virtual environment..." -ForegroundColor Yellow
$activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
if (Test-Path $activateScript) {
    & $activateScript
    Write-Host "  [OK] Virtual environment activated" -ForegroundColor Green
}
else {
    Write-Host "  [ERROR] Activation script not found" -ForegroundColor Red
    exit 1
}

# Upgrade pip
Write-Host ""
Write-Host "[4/5] Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] pip upgraded" -ForegroundColor Green
}
else {
    Write-Host "  [WARN] pip upgrade failed (continuing anyway)" -ForegroundColor Yellow
}

# Install the package with dev dependencies
Write-Host ""
Write-Host "[5/5] Installing Void Walker and dependencies..." -ForegroundColor Yellow
Write-Host "  Installing: google-generativeai, rich, python-dotenv, pydantic, pydantic-settings" -ForegroundColor Gray
Write-Host "  Dev tools: pytest, pytest-asyncio, ruff" -ForegroundColor Gray
pip install -e ".[dev]" --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] All dependencies installed" -ForegroundColor Green
}
else {
    Write-Host "  [ERROR] Installation failed" -ForegroundColor Red
    exit 1
}

# Check for .env file
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$envFile = Join-Path $projectRoot ".env"
$envExample = Join-Path $projectRoot ".env.example"
if (Test-Path $envFile) {
    Write-Host "  [OK] .env file exists" -ForegroundColor Green
}
elseif (Test-Path $envExample) {
    Copy-Item $envExample $envFile
    Write-Host "  [OK] Created .env from .env.example" -ForegroundColor Green
    Write-Host "  [WARN] Remember to add your GOOGLE_API_KEY to .env" -ForegroundColor Yellow
}
else {
    Write-Host "  [WARN] No .env file found. Create one with your GOOGLE_API_KEY:" -ForegroundColor Yellow
    Write-Host "    GOOGLE_API_KEY=your_api_key_here" -ForegroundColor Gray
}

# Print success message
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To activate the environment in the future, run:" -ForegroundColor Cyan
Write-Host "  .venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host ""
Write-Host "To start the game:" -ForegroundColor Cyan
Write-Host "  void-walker" -ForegroundColor White
Write-Host "  # or: python -m void_walker" -ForegroundColor Gray
Write-Host ""
Write-Host "To run tests:" -ForegroundColor Cyan
Write-Host "  pytest" -ForegroundColor White
Write-Host ""
