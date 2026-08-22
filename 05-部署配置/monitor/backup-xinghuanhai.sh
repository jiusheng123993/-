#!/usr/bin/env bash
# 星河宠记数据库每日备份（2026-08-23 新增，P0 修复：此前只有 qinglv 库有备份，xinghuanhai 库无任何备份）
# 只备份 xinghuanhai 库；保留最近 15 份；失败时微信告警（复用 /etc/aixu-monitor.env 的 WEBHOOK_URL）
set -euo pipefail
ENV_FILE="/etc/aixu-monitor.env"
[ -f "$ENV_FILE" ] && . "$ENV_FILE"
mkdir -p /var/backups/xinghuanhai
TS=$(date +%Y%m%d_%H%M)
FILE=/var/backups/xinghuanhai/xinghuanhai_${TS}.sql.gz

if sudo -u postgres pg_dump -d xinghuanhai | gzip > "$FILE"; then
  # 保留最近 15 份
  ls -1t /var/backups/xinghuanhai/xinghuanhai_*.sql.gz 2>/dev/null | tail -n +16 | while read -r f; do rm -f "$f"; done
  echo "backup done: $FILE ($(du -h "$FILE" | cut -f1))"
else
  echo "backup FAILED: $FILE"
  if [ -n "${WEBHOOK_URL:-}" ]; then
    curl -fsS -m 10 -X POST "$WEBHOOK_URL" -H 'Content-Type: application/json' \
      -d '{"title":"[ALERT] 星河宠记数据库备份失败","desp":"xinghuanhai pg_dump 失败，请立即检查服务器！"}' >/dev/null 2>&1 || true
  fi
  exit 1
fi
