@echo off
echo ========================================
echo   GEARBOX WORKSHOP MANAGEMENT
echo   Starting Application...
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend Server...
start "Gearbox Backend" cmd /k "npm run server"
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend...
start "Gearbox Frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   APPLICATION STARTED!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3000
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:5173
echo.
echo Press any key to exit this window...
pause >nul
