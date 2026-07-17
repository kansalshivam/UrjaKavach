#!/bin/bash
# Restore script for Urja Kavach PostgreSQL database
set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <path_to_backup_file.sql>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found at $BACKUP_FILE"
    exit 1
fi

echo "Starting database restore from: $BACKUP_FILE..."
# Force close active connections to allow restore
docker compose exec -T postgres psql -U urjakavach -d urjakavach -c "
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'urjakavach'
  AND pid <> pg_backend_pid();"

docker compose exec -T postgres psql -U urjakavach -d urjakavach -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose exec -i postgres psql -U urjakavach -d urjakavach < "$BACKUP_FILE"
echo "Database restore completed successfully!"
