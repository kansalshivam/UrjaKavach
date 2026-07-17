# Backup script for Urja Kavach PostgreSQL database
# Windows Task Scheduler Setup:
# schtasks /create /tn "UrjaKavach_DB_Backup" /tr "powershell -File c:\Users\shiva\Downloads\UrjaKavach\scripts\db_backup.ps1" /sc daily /st 03:00
$BackupDir = "./backups"
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupFile = "$BackupDir/urjakavach_backup_$Timestamp.sql"

Write-Host "Starting database backup..."
& docker compose exec -T postgres pg_dump -U urjakavach -d urjakavach | Out-File -FilePath $BackupFile -Encoding utf8
Write-Host "Backup saved successfully to: $BackupFile"

# Retention policy: Keep only the last 14 backups
Get-ChildItem -Path $BackupDir -Filter "urjakavach_backup_*.sql" |
    Sort-Object CreationTime -Descending |
    Select-Object -Skip 14 |
    Remove-Item -Force
Write-Host "Old backups cleaned up (retaining last 14)."
