@echo off
title Urja Kavach Local Console
echo ===================================================
echo   Starting Urja Kavach Local Environment...
echo ===================================================
echo.

echo [1/5] Starting Docker containers...
docker compose up -d
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Docker is not running. Please open Docker Desktop and try again.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Waiting 8 seconds for local database to become healthy...
timeout /t 8 /nobreak > NUL

echo [2/5] Running database migrations...
docker compose exec api alembic upgrade head

echo.
echo [3/5] Seeding infrastructure data...
docker compose exec api python app/seed.py

echo.
echo [4/5] Running initial data poll...
docker compose exec api python tests/trigger_polls.py

echo.
echo [5/5] Launching Urja Kavach Dashboard in browser...
start http://localhost:5173/

echo.
echo ===================================================
echo   Urja Kavach is running locally!
echo.
echo   Dashboard URL:  http://localhost:5173/
echo   API Swagger:    http://localhost:8000/docs
echo ===================================================
echo.
echo Leave this window open while using the application.
echo Press any key in this window to STOP the local containers...
pause > NUL

echo.
echo Stopping local containers...
docker compose down
echo Local environment stopped successfully.
pause
