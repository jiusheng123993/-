#!/usr/bin/env bash
# 支付订单每日对账（2026-08-23 新增，P1）
# 每日统计：昨日创建/支付成功/超48h未支付/数据不一致（paid 但 paid_at 为空）
# 异常时微信告警（数据不一致必告；积压订单超 10 单告）
set -u
ENV_FILE="/etc/aixu-monitor.env"
[ -f "$ENV_FILE" ] && . "$ENV_FILE"
LOG_FILE="/var/log/aixu-monitor.log"
STATE_FILE="/var/log/aixu-monitor.state"
mkdir -p "$(dirname "$LOG_FILE")"
now() { date '+%F %T'; }
log() { echo "[$(now)] $*" >> "$LOG_FILE"; }
alert() {
  local key="$1" title="$2" body="$3"
  log "ALERT [$key] $title - $body"
  if grep -q "^$key$" "$STATE_FILE" 2>/dev/null; then return; fi
  echo "$key" >> "$STATE_FILE"
  if [ -n "${WEBHOOK_URL:-}" ]; then
    curl -fsS -m 10 -X POST "$WEBHOOK_URL" -H 'Content-Type: application/json' -d "{\"title\":\"$title\",\"desp\":\"$body\"}" >/dev/null 2>&1 || true
  fi
}
recover() {
  local key="$1"
  [ -f "$STATE_FILE" ] && grep -v "^$key$" "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
  log "RECOVER [$key]"
}

SUMMARY=$(sudo -u postgres psql -d xinghuanhai -t -A -F'|' -c "
SELECT
  COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE - 1) AS 昨日创建,
  COUNT(*) FILTER (WHERE status = 'paid' AND paid_at::date = CURRENT_DATE - 1) AS 昨日支付成功,
  COUNT(*) FILTER (WHERE status = 'pending' AND created_at < NOW() - INTERVAL '48 hours') AS 超48h未支付,
  COUNT(*) FILTER (WHERE status = 'paid' AND paid_at IS NULL) AS 数据不一致
FROM payment_orders;" 2>/dev/null)

if [ -z "$SUMMARY" ]; then
  alert "pay-reconcile" "[ALERT] 支付对账查询失败" "psql 查询 payment_orders 失败，请检查"
  exit 0
fi

Y_CREATED=$(echo "$SUMMARY" | cut -d'|' -f1 | tr -d ' ')
Y_PAID=$(echo "$SUMMARY" | cut -d'|' -f2 | tr -d ' ')
STUCK=$(echo "$SUMMARY" | cut -d'|' -f3 | tr -d ' ')
INCONSISTENT=$(echo "$SUMMARY" | cut -d'|' -f4 | tr -d ' ')
Y_CREATED=${Y_CREATED:-0}; Y_PAID=${Y_PAID:-0}; STUCK=${STUCK:-0}; INCONSISTENT=${INCONSISTENT:-0}

if [ "$INCONSISTENT" -gt 0 ]; then
  alert "pay-inconsistent" "[ALERT] 支付数据不一致 ${INCONSISTENT} 条" "存在 status=paid 但 paid_at 为空的订单，需人工核查！"
else
  recover "pay-inconsistent"
fi

if [ "$STUCK" -gt 10 ]; then
  alert "pay-stuck" "[ALERT] 超48h未支付 ${STUCK} 单" "积压订单过多，请关注支付链路"
else
  recover "pay-stuck"
fi

log "对账: 昨日创建 ${Y_CREATED} / 支付成功 ${Y_PAID} / 超48h未支付 ${STUCK} / 数据不一致 ${INCONSISTENT}"
