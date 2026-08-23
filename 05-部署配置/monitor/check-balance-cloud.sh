#!/usr/bin/env bash
# 云平台 AI 余额告警（2026-08-24 新增，补齐百炼/火山方舟/Seedream 余额覆盖）
# 说明：百炼(阿里云)与火山方舟/Seedream 的「模型 API Key」查不了余额（已实测），
#       必须用账号级 AccessKey(AK/SK)。本脚本从 /opt/xinghuanhai/server/.env 读取：
#         ALIYUN_AK / ALIYUN_SK  → 阿里云 BSS QueryAccountBalance（查百炼账户余额）
#         VOLC_AK / VOLC_SK      → 火山引擎费用中心 QueryBalanceAcct（查方舟/Seedream）
#       未配置的项记录"跳过"；配置的项低于阈值（默认 ¥20）微信告警，恢复自动解除。
# AK/SK 获取：阿里云 RAM 控制台 / 火山引擎访问控制(密钥管理) 创建只读 AccessKey 即可。
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

# 统一阈值：默认 ¥20，可用环境变量覆盖
THRESHOLD=${CLOUD_BALANCE_THRESHOLD:-20}

# ---------- 通用工具 ----------
# URL 编码（阿里云/火山签名通用；参数均为 ASCII，按字节处理即可）
urlencode() {
  local s="$1" out="" i c
  for ((i = 0; i < ${#s}; i++)); do
    c="${s:i:1}"
    case "$c" in
      [A-Za-z0-9._~-]) out+="$c" ;;
      *) printf -v hex '%%%02X' "'$c"; out+="$hex" ;;
    esac
  done
  echo "$out"
}

# 浮点比较：$1 < $2 时输出 1
below() { awk -v a="$1" -v b="$2" 'BEGIN { print (a < b) ? "1" : "0" }'; }

# 从金额字符串提取数值（去逗号/负号/货币符号，保留小数点）
extract_num() { echo "$1" | grep -oE '[0-9]+(\.[0-9]+)?' | head -1; }

# 读服务器 .env 的键值（不打印值）
env_get() {
  grep -E "^$1=" /opt/xinghuanhai/server/.env 2>/dev/null | head -1 | cut -d= -f2- | tr -d ' \r'
}

# ---------- 阿里云 BSS（百炼账户余额）RPC 签名 HMAC-SHA1 ----------
check_aliyun() {
  local AK SK
  AK=$(env_get ALIYUN_AK); SK=$(env_get ALIYUN_SK)
  if [ -z "$AK" ] || [ -z "$SK" ]; then
    log "SKIP [aliyun-balance] ALIYUN_AK/ALIYUN_SK 未配置（需控制台 AccessKey）"
    return
  fi
  local TIMESTAMP NONCE SORTED STRING_TO_SIGN SIGNATURE URL RESP AMOUNT
  TIMESTAMP=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
  NONCE=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || date +%s%N)
  # 固定参数 + 按字典序排序拼接（key=value&...，双方均需 URL 编码）
  SORTED="AccessKeyId=$(urlencode "$AK")&Action=QueryAccountBalance&Format=JSON&SignatureMethod=HMAC-SHA1&SignatureNonce=$(urlencode "$NONCE")&SignatureVersion=1.0&Timestamp=$(urlencode "$TIMESTAMP")&Version=2017-12-14"
  STRING_TO_SIGN="GET&%2F&$(urlencode "$SORTED")"
  # 签名串 = base64(HMAC-SHA1(secret+"&", stringToSign))
  SIGNATURE=$(printf '%s' "$STRING_TO_SIGN" | openssl dgst -sha1 -hmac "${SK}&" -binary | base64 -w0)
  URL="https://business.aliyuncs.com/?${SORTED}&Signature=$(urlencode "$SIGNATURE")"
  RESP=$(curl -fsS -m 10 "$URL" 2>/dev/null) || { alert "aliyun-balance" "[ALERT] 阿里云余额查询失败" "QueryAccountBalance 请求失败，请检查 AK/SK/网络"; return; }
  AMOUNT=$(echo "$RESP" | grep -oE '"AvailableAmount":"?[0-9.]+' | head -1 | grep -oE '[0-9.]+')
  if [ -z "$AMOUNT" ]; then
    # 无金额字段 → 看 Code/Message 判断是否权限不足
    alert "aliyun-balance" "[ALERT] 阿里云余额查询异常" "$(echo "$RESP" | head -c 200)"
    return
  fi
  if [ "$(below "$AMOUNT" "$THRESHOLD")" = "1" ]; then
    alert "aliyun-balance" "[ALERT] 阿里云(百炼)余额低于 ¥$THRESHOLD" "当前余额 ¥${AMOUNT}，请及时充值"
  else
    recover "aliyun-balance"
    log "OK [aliyun-balance] ¥${AMOUNT}"
  fi
}

# ---------- 火山引擎（方舟/Seedream）新版签名 HMAC-SHA256 ----------
check_volc() {
  local AK SK
  AK=$(env_get VOLC_AK); SK=$(env_get VOLC_SK)
  if [ -z "$AK" ] || [ -z "$SK" ]; then
    log "SKIP [volc-balance] VOLC_AK/VOLC_SK 未配置（需控制台 AccessKey）"
    return
  fi
  local XDATE SHORTDATE REGION SERVICE QUERY CANONHEADERS SIGNEDHEADERS
  local PAYLOAD_HASH CANONREQ STRING_TO_SIGN K1 K2 K3 KSIGN SIGNATURE URL RESP AMOUNT
  XDATE=$(date -u '+%Y%m%dT%H%M%SZ')
  SHORTDATE=${XDATE:0:8}
  REGION="cn-north-1"          # 火山引擎默认地域
  SERVICE="billing"            # 费用中心服务名
  # GET 请求无 body，query 为业务参数（Action/Version）
  QUERY="Action=QueryBalanceAcct&Version=2022-01-01"
  CANONHEADERS="host:open.volcengineapi.com\nx-date:${XDATE}\n"
  SIGNEDHEADERS="host;x-date"
  PAYLOAD_HASH=$(printf '' | openssl dgst -sha256 | awk '{print $2}')
  CANONREQ="GET\n/\n${QUERY}\n${CANONHEADERS}\n${SIGNEDHEADERS}\n${PAYLOAD_HASH}"
  STRING_TO_SIGN="HMAC-SHA256\n${XDATE}\n${SHORTDATE}/${REGION}/${SERVICE}/request\n$(printf '%b' "$CANONREQ" | openssl dgst -sha256 | awk '{print $2}')"
  # 派生签名密钥：HMAC(HMAC(HMAC(HMAC(SK,date),region),service),"request")
  K1=$(printf '%s' "$SHORTDATE" | openssl dgst -sha256 -hmac "$SK" | awk '{print $2}')
  K2=$(printf '%s' "$REGION" | openssl dgst -sha256 -hmac "$K1" | awk '{print $2}')
  K3=$(printf '%s' "$SERVICE" | openssl dgst -sha256 -hmac "$K2" | awk '{print $2}')
  KSIGN=$(printf '%s' "request" | openssl dgst -sha256 -hmac "$K3" | awk '{print $2}')
  SIGNATURE=$(printf '%b' "$STRING_TO_SIGN" | openssl dgst -sha256 -hmac "$KSIGN" | awk '{print $2}')
  local AUTH
  AUTH="HMAC-SHA256 Credential=${AK}/${SHORTDATE}/${REGION}/${SERVICE}/request, SignedHeaders=${SIGNEDHEADERS}, Signature=${SIGNATURE}"
  URL="https://open.volcengineapi.com/?${QUERY}"
  RESP=$(curl -fsS -m 10 -H "X-Date: $XDATE" -H "Authorization: $AUTH" "$URL" 2>/dev/null)
  if [ -z "$RESP" ]; then
    alert "volc-balance" "[ALERT] 火山引擎余额查询失败" "QueryBalanceAcct 请求失败，请检查 AK/SK/网络"
    return
  fi
  if echo "$RESP" | grep -q '"Error"'; then
    alert "volc-balance" "[ALERT] 火山引擎余额查询异常" "$(echo "$RESP" | head -c 200)"
    return
  fi
  AMOUNT=$(echo "$RESP" | grep -oE '"AvailableBalance":"?[0-9.]+' | head -1 | grep -oE '[0-9.]+')
  if [ -z "$AMOUNT" ]; then
    AMOUNT=$(echo "$RESP" | grep -oE '"Balance":"?[0-9.]+' | head -1 | grep -oE '[0-9.]+')
  fi
  if [ -z "$AMOUNT" ]; then
    alert "volc-balance" "[ALERT] 火山引擎余额字段解析失败" "$(echo "$RESP" | head -c 200)"
    return
  fi
  if [ "$(below "$AMOUNT" "$THRESHOLD")" = "1" ]; then
    alert "volc-balance" "[ALERT] 火山引擎(方舟/Seedream)余额低于 ¥$THRESHOLD" "当前余额 ¥${AMOUNT}，请及时充值"
  else
    recover "volc-balance"
    log "OK [volc-balance] ¥${AMOUNT}"
  fi
}

check_aliyun
check_volc
echo "cloud balance check done"
