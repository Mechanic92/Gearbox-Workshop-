@echo off
echo ========================================
echo   BUILDING GEARBOX DESKTOP APP
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Building frontend...
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build frontend
    pause
    exit /b 1
)

echo.
echo [3/3] Creating Windows installer...
call npm run electron:build-win
if errorlevel 1 (
    echo ERROR: Failed to build installer
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BUILD COMPLETE!
echo ========================================
echo.
echo Installer location:
echo   release\Gearbox Workshop-Setup-1.0.0.exe
echo.
echo Installer size: ~150-200MB
echo.
echo To install:
echo   1. Double-click the installer
echo   2. Follow installation wizard
echo   3. Launch from Start Menu or Desktop
echo.
pause
