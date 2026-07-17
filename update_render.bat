@echo off
title Urja Kavach - Update Render Data
echo ===================================================
echo   Urja Kavach - Refresh Live Cloud Database
echo ===================================================
echo.
echo This script will update the LIVE Render/Neon database.
echo Make sure Docker Desktop is open and running!
echo.
pause

echo.
echo [1/2] Checking Docker is running...
docker info > NUL 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Docker is not running. Please open Docker Desktop and try again.
    pause
    exit /b 1
)
echo Docker is running. Good.

echo.
echo [2/2] Starting containers and running cloud data poll...
docker compose up -d --no-recreate > NUL 2>&1
timeout /t 5 /nobreak > NUL

docker compose exec ^
  -e DATABASE_URL="postgresql+asyncpg://neondb_owner:npg_Zpem1x3ydLDF@ep-hidden-butterfly-avw5lo4d.c-11.us-east-1.aws.neon.tech/neondb?ssl=require" ^
  -e PYTHONPATH=. ^
  api python tests/trigger_polls.py

echo.
if %ERRORLEVEL% equ 0 (
    echo ===================================================
    echo   SUCCESS! Live database has been refreshed.
    echo   Refresh your Vercel app to see updated scores:
    echo   https://urja-kavach.vercel.app/
    echo ===================================================
) else (
    echo ===================================================
    echo   [ERROR] Poll failed. Check the output above.
    echo ===================================================
)

echo.
pause
