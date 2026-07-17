# Restore script for Urja Kavach PostgreSQL database
param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file not found at $BackupFile"
    exit 1
}

Write-Host "Starting database restore from: $BackupFile..."

# Force close active connections to allow restore
& docker compose exec -T postgres psql -U urjakavach -d urjakavach -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = 'urjakavach' AND pid <> pg_backend_pid();"

& docker compose exec -T postgres psql -U urjakavach -d urjakavach -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
Get-Content $BackupFile | & docker compose exec -i postgres psql -U urjakavach -d urjakavach

Write-Host "Database restore completed successfully!"
