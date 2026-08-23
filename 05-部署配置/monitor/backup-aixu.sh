#!/usr/bin/env bash
set -euo pipefail
mkdir -p /var/backups
TS=$(date +%Y%m%d_%H%M)
FILE=/var/backups/aixu_${TS}.sql.gz
sudo -u postgres pg_dump -d qinglv | gzip > "$FILE"
ls -1t /var/backups/aixu_*.sql.gz 2>/dev/null | tail -n +15 | while read -r f; do rm -f "$f"; done
echo "backup done: $FILE"
