@echo off
echo ========================================
echo   TESTING GEARBOX DESKTOP APP
echo ========================================
echo.

cd /d "%~dp0"

echo Starting Backend server...
start "Gearbox Backend" cmd /k "npm run server"

timeout /t 3 /nobreak >nul

echo Starting Vite dev server...
start "Gearbox Vite" cmd /k "npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo Starting Electron...
echo.
echo The desktop app window will open shortly.
echo.
echo To test:
echo   1. App should open in a native window
echo   2. All features should work
echo   3. Check system tray icon (bottom-right)
echo   4. Test mobile access: http://192.168.1.6:5173
echo.
echo Press Ctrl+C in this window to stop testing.
echo.

call npm run electron:dev
