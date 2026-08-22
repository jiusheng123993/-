#!/usr/bin/env bash
set -u
DISK_THRESHOLD=85
MEM_THRESHOLD_MB=200
CERT_WARN_DAYS=14
ENV_FILE="/etc/aixu-monitor.env"
LOG_FILE="/var/log/aixu-monitor.log"
STATE_FILE="/var/log/aixu-monitor.state"
AIXU_HEALTH="http://127.0.0.1:3001/api/health"
XHH_HEALTH="http://127.0.0.1:3000/api/health"
CERT_FILE="/etc/letsencrypt/live/xinghuanhai.com/fullchain.pem"
mkdir -p "$(dirname "$LOG_FILE")"
[ -f "$ENV_FILE" ] && . "$ENV_FILE"
now() { date '+%F %T'; }
log() { echo "[$(now)] $*" >> "$LOG_FILE"; }
alert() {
  local key="$1" title="$2" body="$3"
  log "ALERT [$key] $title - $body"
  if grep -q "^$key$" "$STATE_FILE" 2>/dev/null; then return; fi
  echo "$key" >> "$STATE_FILE"
  if [ -n "${WEBHOOK_URL:-}" ]; then
    curl -fsS -m 10 -X POST "$WEBHOOK_URL" -H 'Content-Type: application/json' -d "{\"title\":\"$title\",\"desp\":\"$body\"}" >/dev/null 2>&1 || log "WEBHOOK ????"
  fi
}
recover() {
  local key="$1"
  [ -f "$STATE_FILE" ] && grep -v "^$key$" "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
  log "RECOVER [$key]"
}
check_service() {
  local name="$1" url="$2" key="$3"
  if curl -fsS -m 8 "$url" >/dev/null 2>&1; then recover "$key"; log "OK [$name]"; else alert "$key" "[ALERT] $name down" "$name health check failed: $url"; fi
}
check_service "aixu-api" "$AIXU_HEALTH" "svc-aixu"
check_service "xinghuanhai-server" "$XHH_HEALTH" "svc-xhh"
if systemctl is-active --quiet postgresql 2>/dev/null; then recover "db-postgres"; log "OK [postgresql]"; else alert "db-postgres" "[ALERT] postgres down" "postgresql not running"; fi
DISK_PCT=$(df -P / 2>/dev/null | awk 'NR==2 {gsub("%","",$5); print $5}')
if [ -n "$DISK_PCT" ] && [ "$DISK_PCT" -ge "$DISK_THRESHOLD" ]; then alert "disk-root" "[ALERT] disk ${DISK_PCT}%" "root disk over ${DISK_THRESHOLD}%"; else recover "disk-root"; fi
if [ -f "$CERT_FILE" ]; then
  CERT_DAYS=$(openssl x509 -enddate -noout -in "$CERT_FILE" 2>/dev/null | sed 's/notAfter=//' | date -f - +%s 2>/dev/null | awk '{printf "%.0f", ($1 - systime())/86400}')
  if [ -n "$CERT_DAYS" ] && [ "$CERT_DAYS" -lt "$CERT_WARN_DAYS" ]; then alert "cert-expire" "[ALERT] cert ${CERT_DAYS}d" "cert expires soon"; else recover "cert-expire"; fi
fi
MEM_AVAIL_MB=$(free -m 2>/dev/null | awk '/Mem:/ {print $7}')
if [ -n "$MEM_AVAIL_MB" ] && [ "$MEM_AVAIL_MB" -lt "$MEM_THRESHOLD_MB" ]; then alert "mem-low" "[ALERT] mem ${MEM_AVAIL_MB}MB" "available memory low"; else recover "mem-low"; fi
log "monitor done"
