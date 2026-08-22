#!/usr/bin/env bash
# DeepSeek AI 余额告警（2026-08-23 新增，P1）
# 查询 DeepSeek 官方账户余额，不可用或低于 ¥10 时微信告警；恢复后自动解除
# 说明：ARK/百炼/Seedream 余额需控制台账号密钥(AK/SK)才能查，本期仅覆盖 DeepSeek 官方(AI_API_KEY)
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

# 只读服务器 .env 的 DeepSeek 官方 key（不打印值）
API_KEY=$(grep -E '^AI_API_KEY=' /opt/xinghuanhai/server/.env | cut -d= -f2- | tr -d ' \r')
if [ -z "$API_KEY" ]; then
  log "AI_API_KEY 未配置，跳过余额检查"
  exit 0
fi

BALANCE=$(curl -fsS -m 10 -H "Authorization: Bearer $API_KEY" https://api.deepseek.com/user/balance 2>/dev/null)
if [ -z "$BALANCE" ]; then
  alert "ai-balance" "[ALERT] DeepSeek 余额查询失败" "balance API 请求失败，请检查网络/Key"
  exit 0
fi

AVAILABLE=$(echo "$BALANCE" | grep -oE '"is_available":(true|false)' | head -1 | cut -d: -f2 | tr -d ' ')
TOTAL=$(echo "$BALANCE" | grep -oE '"total_balance":"?[0-9.]+' | head -1 | grep -oE '[0-9.]+')
THRESHOLD=10

# 用 awk 做浮点比较（避免依赖 bc）
BELOW=$(awk -v t="${TOTAL:-0}" 'BEGIN { print (t < 10) ? "1" : "0" }')

if [ "$AVAILABLE" = "false" ]; then
  alert "ai-balance" "[ALERT] DeepSeek 余额不可用" "账户不可用，AI 对话将失败，请立即充值"
elif [ "$BELOW" = "1" ]; then
  alert "ai-balance" "[ALERT] DeepSeek 余额低于 ¥$THRESHOLD" "当前余额 ¥${TOTAL}，请及时充值"
else
  recover "ai-balance"
  log "OK [ai-balance] ¥${TOTAL}"
fi
