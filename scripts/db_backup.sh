#!/bin/bash
# Backup script for Urja Kavach PostgreSQL database
# Linux Crontab Setup (Runs daily at 03:00):
# 0 3 * * * /bin/bash /path/to/UrjaKavach/scripts/db_backup.sh
set -e

BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%F_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/urjakavach_backup_$TIMESTAMP.sql"

echo "Starting database backup..."
docker compose exec -T postgres pg_dump -U urjakavach -d urjakavach > "$BACKUP_FILE"
echo "Backup saved successfully to: $BACKUP_FILE"

# Retention policy: Keep only the last 14 backups
ls -t "$BACKUP_DIR"/urjakavach_backup_*.sql 2>/dev/null | tail -n +15 | xargs rm -f 2>/dev/null || true
echo "Old backups cleaned up (retaining last 14)."
