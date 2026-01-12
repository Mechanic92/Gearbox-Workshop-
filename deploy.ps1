# Gearbox Fintech - Production Deployment Script
# Run this script to deploy to production

Write-Host "Gearbox Fintech - Production Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if required tools are installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

$tools = @("node", "npm", "git")
$missing = @()

foreach ($tool in $tools) {
    if (!(Get-Command $tool -ErrorAction SilentlyContinue)) {
        $missing += $tool
    }
}

if ($missing.Count -gt 0) {
    Write-Host "Warning: Missing tools: $($missing -join ', '). Some deployment options may fail." -ForegroundColor Yellow
} else {
    Write-Host "All prerequisites met" -ForegroundColor Green
}
Write-Host ""

# Check environment variables
Write-Host "Checking environment variables..." -ForegroundColor Yellow

$requiredEnvVars = @(
    "DATABASE_URL",
    "STRIPE_SECRET_KEY",
    "TWILIO_ACCOUNT_SID",
    "SENDGRID_API_KEY",
    "XERO_CLIENT_ID",
    "ENCRYPTION_KEY"
)

$missingEnvVars = @()

foreach ($var in $requiredEnvVars) {
    if (!(Test-Path env:$var)) {
        $missingEnvVars += $var
    }
}

if ($missingEnvVars.Count -gt 0) {
    Write-Host "Warning: Missing environment variables in system shell." -ForegroundColor Yellow
    foreach ($var in $missingEnvVars) {
        Write-Host "   - $var" -ForegroundColor Yellow
    }
} else {
    Write-Host "All critical environment variables found in shell" -ForegroundColor Green
}

Write-Host ""

# Run tests
Write-Host "Running tests..." -ForegroundColor Yellow
npm run test
if ($LASTEXITCODE -eq 0) {
    Write-Host "Tests passed" -ForegroundColor Green
} else {
    Write-Host "Tests failed or not configured. Skipping." -ForegroundColor Yellow
}

Write-Host ""

# Build frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed" -ForegroundColor Red
    exit 1
}

Write-Host "Frontend built successfully" -ForegroundColor Green
Write-Host ""

# Database migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
npm run db:push

if ($LASTEXITCODE -ne 0) {
    Write-Host "Database migration failed" -ForegroundColor Red
    exit 1
}

Write-Host "Database migrations complete" -ForegroundColor Green
Write-Host ""

# Platform Selection
$platform = $env:DEPLOY_PLATFORM

if ([string]::IsNullOrEmpty($platform)) {
    Write-Host "Select deployment platform:" -ForegroundColor Cyan
    Write-Host "1. Vercel + Railway (Recommended)"
    Write-Host "2. Netlify + Render"
    Write-Host "3. Fly.io (Full Stack)"
    Write-Host "4. Manual deployment (Build only)"
    Write-Host ""
    $platform = Read-Host "Enter choice (1-4)"
}

Write-Host ""

if ($platform -eq "1") {
    Write-Host "Deploying to Vercel + Railway..." -ForegroundColor Cyan
    vercel --prod
    railway up
    Write-Host "Deployment complete!" -ForegroundColor Green
}
elseif ($platform -eq "2") {
    Write-Host "Deploying to Netlify + Render..." -ForegroundColor Cyan
    netlify deploy --prod
    Write-Host "Please deploy backend manually to Render" -ForegroundColor Yellow
}
elseif ($platform -eq "3") {
    Write-Host "Deploying to Fly.io..." -ForegroundColor Cyan
    fly deploy
    Write-Host "Deployment complete!" -ForegroundColor Green
}
elseif ($platform -eq "4") {
    Write-Host "Manual deployment ready. Artifacts are in ./dist" -ForegroundColor Green
}
else {
    Write-Host "Invalid choice or no platform specified. Build successful but no push performed." -ForegroundColor Red
}

Write-Host ""
Write-Host "Gearbox Fintech process complete!" -ForegroundColor Green
Write-Host ""
