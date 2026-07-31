/**
 * 微信支付适配层 - 第三方集成层
 * 封装微信支付 V3 API，支持 Mock 模式和真实模式
 *
 * 设计原则：
 *   1. Mock 模式（WECHAT_PAY_MOCK=true，默认）：不调真实微信 API，本地开发即可走通全流程
 *   2. 真实模式（WECHAT_PAY_MOCK=false）：调用微信支付 V3 API
 *   3. 业务层只依赖本服务接口，不感知底层模式切换
 *
 * 安全约束：
 *   - 所有敏感字段（apiV3Key、privateKey）从 config 注入，禁止硬编码
 *   - 回调验签 + AES-256-GCM 解密
 *   - 拒绝处理已处理的订单（通过 transaction_id 唯一索引 + 订单 CAS 状态机保证）
 *
 * 接口契约：
 *   - createJsapiPayment：创建 JSAPI 支付，返回前端调起支付所需参数
 *   - verifyAndDecodeNotify：验证回调签名 + 解密回调内容
 *   - queryOrder：主动查询订单状态（兜底回调丢失）
 *   - refund：退款（用于审核失败后自动退款）
 */
import crypto from 'crypto';
import fs from 'fs';
import { config } from '../config.js';
import { sanitizeLog } from '../utils/sanitize.js';

/** JSAPI 支付参数（前端 wx.requestPayment 用） */
export interface JsapiPaymentParams {
  /** 微信预支付会话标识 */
  prepay_id: string;
  /** 小程序 appId */
  appId: string;
  /** 时间戳（秒） */
  timeStamp: string;
  /** 随机字符串 */
  nonceStr: string;
  /** 订单详情扩展字符串（prepay_id=xxx） */
  package: string;
  /** 签名类型 */
  signType: 'RSA';
  /** 签名 */
  paySign: string;
  /** 我方订单号（用于前端追踪） */
  orderId: string;
}

/** 微信回调通知解析结果 */
export interface WechatNotifyResult {
  /** 我方订单号 */
  out_trade_no: string;
  /** 微信支付订单号 */
  transaction_id: string;
  /** 交易状态：SUCCESS / REFUND / NOTPAY / CLOSED / REVOKED / USERPAYING / PAYERROR */
  trade_state: string;
  /** 实际支付金额（分） */
  amount_total: number;
  /** 用户 openid */
  payer_openid?: string;
}

/** 退款结果 */
export interface RefundResult {
  refund_id: string;
  status: 'SUCCESS' | 'PROCESSING' | 'CLOSED' | 'ABNORMAL';
}

/**
 * 是否启用 Mock 模式
 */
export function isMockMode(): boolean {
  return config.wechatPay.mock;
}

/**
 * 创建 JSAPI 支付订单
 * @param orderId - 我方订单号（payment_orders.id）
 * @param amount - 金额（分）
 * @param description - 订单描述
 * @param openid - 用户 openid（小程序场景必填）
 */
export async function createJsapiPayment(
  orderId: string,
  amount: number,
  description: string,
  openid: string,
): Promise<JsapiPaymentParams> {
  if (amount <= 0) {
    throw new Error('[WechatPay] 金额必须大于 0');
  }
  if (!openid) {
    throw new Error('[WechatPay] JSAPI 支付必须提供 openid');
  }

  if (isMockMode()) {
    return createMockJsapiPayment(orderId, amount, description);
  }

  return createRealJsapiPayment(orderId, amount, description, openid);
}

/**
 * 验证并解密微信回调通知
 *
 * 步骤：
 *   1. 验证签名（防伪造）
 *   2. 解密 AES-256-GCM（防篡改）
 *   3. 返回结构化结果
 *
 * @param timestamp - Wechatpay-Timestamp 请求头
 * @param nonce - Wechatpay-Nonce 请求头
 * @param serial - Wechatpay-Serial 请求头（平台证书序列号）
 * @param signature - Wechatpay-Signature 请求头
 * @param rawBody - 原始请求体（未解析的字符串）
 */
export async function verifyAndDecodeNotify(
  timestamp: string,
  nonce: string,
  serial: string,
  signature: string,
  rawBody: string,
): Promise<WechatNotifyResult> {
  if (isMockMode()) {
    return decodeMockNotify(rawBody);
  }

  return verifyAndDecodeRealNotify(timestamp, nonce, serial, signature, rawBody);
}

/**
 * 主动查询订单状态（用于回调丢失时的兜底）
 */
export async function queryOrder(orderId: string): Promise<{
  trade_state: string;
  transaction_id?: string;
  amount_total?: number;
}> {
  if (isMockMode()) {
    // Mock 模式下，订单状态由 payment_orders 表驱动，这里返回 SUCCESS 即可
    return { trade_state: 'SUCCESS', transaction_id: `mock_tx_${orderId}` };
  }

  // 真实模式：GET /v3/pay/transactions/out-trade-no/{out_trade_no}?mchid={mchid}
  const path = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(orderId)}?mchid=${config.wechatPay.mchId}`;
  const result = await requestWithSign<{
    trade_state: string;
    transaction_id?: string;
    amount?: { total?: number; payer_total?: number };
  }>('GET', path);
  return {
    trade_state: result.trade_state,
    transaction_id: result.transaction_id,
    amount_total: result.amount?.payer_total ?? result.amount?.total,
  };
}

/**
 * 退款
 * @param orderId - 我方订单号
 * @param amount - 退款金额（分，全额退款时应等于原支付金额）
 * @param reason - 退款原因
 */
export async function refund(
  orderId: string,
  amount: number,
  reason: string,
): Promise<RefundResult> {
  if (amount <= 0) {
    throw new Error('[WechatPay] 退款金额必须大于 0');
  }

  if (isMockMode()) {
    console.log(`[WechatPay Mock] 退款成功: orderId=${sanitizeLog(orderId)}, amount=${amount}, reason=${sanitizeLog(reason)}`);
    return { refund_id: `mock_refund_${orderId}`, status: 'SUCCESS' };
  }

  // 真实模式：POST /v3/refund/domestic/refunds
  // amount.total 必须等于原订单金额（全额退款场景下即退款金额）
  const result = await requestWithSign<{ refund_id: string; status: string }>(
    'POST',
    '/v3/refund/domestic/refunds',
    {
      out_refund_no: `R${orderId}`,
      out_trade_no: orderId,
      reason: reason.slice(0, 80),
      notify_url: config.wechatPay.notifyUrl || undefined,
      amount: { total: amount, currency: 'CNY', refund: amount },
    },
  );
  if (!result.refund_id) {
    throw new Error('[WechatPay] 退款请求失败：响应缺少 refund_id');
  }
  return {
    refund_id: result.refund_id,
    status: result.status as RefundResult['status'],
  };
}

// ===== Mock 模式实现 =====

/**
 * Mock 模式创建 JSAPI 支付
 * 返回模拟参数，前端可直接调起 wx.requestPayment（实际不会扣款）
 */
function createMockJsapiPayment(
  orderId: string,
  amount: number,
  description: string,
): JsapiPaymentParams {
  const mockPrepayId = `mock_prepay_${orderId}_${Date.now()}`;
  console.log(
    `[WechatPay Mock] 创建支付订单: orderId=${sanitizeLog(orderId)}, amount=${amount}, desc=${sanitizeLog(description)}`,
  );

  return {
    prepay_id: mockPrepayId,
    appId: config.wechat.appId || 'mock_appid',
    timeStamp: String(Math.floor(Date.now() / 1000)),
    nonceStr: crypto.randomBytes(16).toString('hex'),
    package: `prepay_id=${mockPrepayId}`,
    signType: 'RSA',
    paySign: 'mock_signature',
    orderId,
  };
}

/**
 * Mock 模式解析回调
 * 约定：Mock 模式下"创建订单后即视为已支付"，但为了走通完整回调链路，
 * 提供 mockNotify 工具函数主动触发回调（供测试或开发期手动模拟）
 *
 * rawBody 格式约定（开发期协议）：
 *   { "out_trade_no": "xxx", "transaction_id": "mock_tx_xxx", "trade_state": "SUCCESS", "amount_total": 990 }
 */
function decodeMockNotify(rawBody: string): WechatNotifyResult {
  try {
    const data = JSON.parse(rawBody) as Partial<WechatNotifyResult>;
    if (!data.out_trade_no || !data.transaction_id || !data.trade_state) {
      throw new Error('Mock 回调缺少必需字段：out_trade_no / transaction_id / trade_state');
    }
    return {
      out_trade_no: data.out_trade_no,
      transaction_id: data.transaction_id,
      trade_state: data.trade_state,
      amount_total: data.amount_total ?? 0,
      payer_openid: data.payer_openid,
    };
  } catch (err) {
    throw new Error(`[WechatPay Mock] 回调解析失败: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

/**
 * Mock 模式构造回调请求体（仅用于测试和开发期手动触发）
 */
export function buildMockNotifyBody(
  orderId: string,
  amount: number,
  tradeState: 'SUCCESS' | 'FAILED' = 'SUCCESS',
): string {
  return JSON.stringify({
    out_trade_no: orderId,
    transaction_id: `mock_tx_${orderId}`,
    trade_state: tradeState,
    amount_total: amount,
  });
}

// ===== 真实模式实现（微信支付 V3，Node 内置 crypto + fetch，零额外依赖） =====

/** 微信支付 V3 API 基础地址 */
const WECHAT_PAY_API_BASE = 'https://api.mch.weixin.qq.com';

/** 微信支付 API 请求 User-Agent（微信要求必填） */
const WECHAT_PAY_UA = 'xinghuanhai-server/1.0.0';

/** PEM 配置加载缓存（privateKey / platformCert） */
const pemCache = new Map<string, string>();

/** 商户私钥 KeyObject 缓存 */
let cachedPrivateKey: crypto.KeyObject | null = null;

/** 平台证书公钥 KeyObject 缓存 */
let cachedPlatformPublicKey: crypto.KeyObject | null = null;

/**
 * 加载 PEM 配置：支持直接传 PEM 内容（-----BEGIN 开头）或文件路径
 * @param value - 配置值
 * @param envKey - 环境变量名（用于错误提示）
 */
function loadPemConfig(value: string, envKey: string): string {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    throw new Error(`[WechatPay] 缺少配置: ${envKey}（请参考 .env.example 配置微信支付）`);
  }
  if (trimmed.startsWith('-----BEGIN')) {
    return trimmed;
  }
  // 文件路径模式（带缓存，避免每次请求读磁盘）
  if (pemCache.has(trimmed)) return pemCache.get(trimmed)!;
  if (fs.existsSync(trimmed)) {
    const content = fs.readFileSync(trimmed, 'utf8').trim();
    pemCache.set(trimmed, content);
    return content;
  }
  throw new Error(`[WechatPay] ${envKey} 既不是 PEM 内容也不是有效文件路径`);
}

/** 获取商户私钥（用于请求签名 / paySign 计算） */
function getPrivateKeyObject(): crypto.KeyObject {
  if (!cachedPrivateKey) {
    cachedPrivateKey = crypto.createPrivateKey(
      loadPemConfig(config.wechatPay.privateKey, 'WECHAT_PAY_PRIVATE_KEY'),
    );
  }
  return cachedPrivateKey;
}

/** 获取平台证书公钥（用于回调验签） */
function getPlatformPublicKeyObject(): crypto.KeyObject {
  if (!cachedPlatformPublicKey) {
    cachedPlatformPublicKey = crypto.createPublicKey(
      loadPemConfig(config.wechatPay.platformCert, 'WECHAT_PAY_PLATFORM_CERT'),
    );
  }
  return cachedPlatformPublicKey;
}

/** SHA256-RSA2048 签名（微信支付 V3 规范） */
function sha256WithRsa(data: string): string {
  return crypto.createSign('RSA-SHA256').update(data).sign(getPrivateKeyObject(), 'base64');
}

/**
 * 构建请求 Authorization 头并返回签名参数
 *
 * 签名串规则（官方规范）：
 *   - POST：`POST\n{path}\n{timestamp}\n{nonce}\n{JSON请求体}\n`
 *   - GET： `GET\n{path?query}\n{timestamp}\n{nonce}\n\n`（第 5 行为空 + 结尾换行）
 *
 * @param method - HTTP 方法
 * @param pathWithQuery - 去掉域名的 path（含 query，不 URL 编码）
 * @param bodyStr - JSON 请求体字符串（GET 传 undefined）
 */
function buildAuthorization(
  method: 'GET' | 'POST',
  pathWithQuery: string,
  bodyStr?: string,
): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = String(Math.floor(Date.now() / 1000));
  // 拼接签名串：末行 body 有内容则为 body+换行，否则为空行
  const signatureText = `${method}\n${pathWithQuery}\n${timestamp}\n${nonce}\n${bodyStr ? `${bodyStr}\n` : '\n'}`;
  const signature = sha256WithRsa(signatureText);
  return (
    `WECHATPAY2-SHA256-RSA2048 mchid="${config.wechatPay.mchId}",` +
    `nonce_str="${nonce}",` +
    `timestamp="${timestamp}",` +
    `serial_no="${config.wechatPay.certSerialNo}",` +
    `signature="${signature}"`
  );
}

/**
 * 携带签名发送微信支付 V3 请求
 * 非 2xx 响应解析 { code, message } 抛出业务错误
 */
async function requestWithSign<T>(
  method: 'GET' | 'POST',
  pathWithQuery: string,
  body?: unknown,
): Promise<T> {
  const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;
  const authorization = buildAuthorization(method, pathWithQuery, bodyStr);

  const headers: Record<string, string> = {
    Authorization: authorization,
    Accept: 'application/json',
    'User-Agent': WECHAT_PAY_UA,
  };
  if (bodyStr !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${WECHAT_PAY_API_BASE}${pathWithQuery}`, {
    method,
    headers,
    body: bodyStr,
    signal: AbortSignal.timeout(15_000),
  });

  const text = await response.text();
  if (!response.ok) {
    let message = `微信支付请求失败: HTTP ${response.status}`;
    try {
      const errBody = JSON.parse(text) as { code?: string; message?: string };
      if (errBody.code || errBody.message) {
        message = `微信支付请求失败: ${errBody.code || ''} ${errBody.message || ''}`.trim();
      }
    } catch {
      // 非 JSON 错误体，保留默认错误信息
    }
    throw new Error(message);
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}

/**
 * AES-256-GCM 解密微信回调 resource
 *
 * 规范：ciphertext 为 base64 编码，后 16 字节为 GCM 认证标签；
 *       associated_data / nonce 为明文附加串，直接作为 AAD / nonce。
 */
function decipherGcm(ciphertext: string, associatedData: string, nonce: string): string {
  const key = config.wechatPay.apiV3Key;
  if (!key) {
    throw new Error('[WechatPay] 缺少配置: WECHAT_PAY_API_V3_KEY（回调解密必需）');
  }
  const buf = Buffer.from(ciphertext, 'base64');
  const authTag = buf.subarray(buf.length - 16);
  const data = buf.subarray(0, buf.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(authTag);
  decipher.setAAD(Buffer.from(associatedData, 'utf8'));
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/**
 * 真实模式创建 JSAPI 支付
 * 调用微信支付 V3：POST /v3/pay/transactions/jsapi，返回前端 wx.requestPayment 所需参数
 */
async function createRealJsapiPayment(
  orderId: string,
  amount: number,
  description: string,
  openid: string,
): Promise<JsapiPaymentParams> {
  const appId = config.wechat.appId;
  if (!appId) {
    throw new Error('[WechatPay] 缺少配置: WECHAT_APPID');
  }
  if (!config.wechatPay.notifyUrl) {
    throw new Error('[WechatPay] 缺少配置: WECHAT_PAY_NOTIFY_URL（回调地址必须公网可访问）');
  }

  const result = await requestWithSign<{ prepay_id: string }>(
    'POST',
    '/v3/pay/transactions/jsapi',
    {
      appid: appId,
      mchid: config.wechatPay.mchId,
      description,
      out_trade_no: orderId,
      notify_url: config.wechatPay.notifyUrl,
      amount: { total: amount, currency: 'CNY' },
      payer: { openid },
    },
  );

  if (!result.prepay_id) {
    throw new Error('[WechatPay] 微信下单失败：响应缺少 prepay_id');
  }

  // 计算 wx.requestPayment 调起签名（签名串：appId\ntimeStamp\nnonceStr\nprepay_id=xxx\n）
  const timeStamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const packageStr = `prepay_id=${result.prepay_id}`;
  const paySignText = `${appId}\n${timeStamp}\n${nonceStr}\n${packageStr}\n`;
  const paySign = sha256WithRsa(paySignText);

  return {
    prepay_id: result.prepay_id,
    appId,
    timeStamp,
    nonceStr,
    package: packageStr,
    signType: 'RSA',
    paySign,
    orderId,
  };
}

/**
 * 真实模式验签 + 解密回调
 *
 * 步骤：
 *   1. 时间戳防重放（±300s）
 *   2. 校验 Wechatpay-Serial 是否等于配置的平台证书序列号
 *   3. 用平台证书公钥验签（签名串：timestamp\nnonce\nrawBody\n，rawBody 必须为原始字符串）
 *   4. 用 apiV3Key 解密 resource.ciphertext（AES-256-GCM）
 *   5. 映射为 WechatNotifyResult
 */
async function verifyAndDecodeRealNotify(
  timestamp: string,
  nonce: string,
  serial: string,
  signature: string,
  rawBody: string,
): Promise<WechatNotifyResult> {
  // 1. 时间戳防重放
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
    throw new Error('[WechatPay] 回调时间戳超出有效范围（防重放校验失败）');
  }

  // 2. 平台证书序列号校验
  const expectedSerial = config.wechatPay.platformCertSerialNo;
  if (!expectedSerial) {
    throw new Error('[WechatPay] 缺少配置: WECHAT_PAY_PLATFORM_CERT_SERIAL_NO');
  }
  if (serial !== expectedSerial) {
    throw new Error('[WechatPay] 回调证书序列号不匹配');
  }

  // 3. 验签（rawBody 必须是微信发送的原始请求体）
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(`${timestamp}\n${nonce}\n${rawBody}\n`);
  const valid = verify.verify(getPlatformPublicKeyObject(), signature, 'base64');
  if (!valid) {
    throw new Error('[WechatPay] 回调签名验证失败');
  }

  // 4. 解密 resource
  const parsed = JSON.parse(rawBody) as {
    resource?: {
      algorithm?: string;
      ciphertext?: string;
      associated_data?: string;
      nonce?: string;
    };
  };
  const resource = parsed.resource;
  if (!resource?.ciphertext || !resource.nonce) {
    throw new Error('[WechatPay] 回调缺少 resource 加密内容');
  }
  const decrypted = decipherGcm(resource.ciphertext, resource.associated_data ?? '', resource.nonce);
  const data = JSON.parse(decrypted) as {
    out_trade_no?: string;
    transaction_id?: string;
    trade_state?: string;
    amount?: { total?: number; payer_total?: number };
    payer?: { openid?: string };
  };

  if (!data.out_trade_no || !data.transaction_id || !data.trade_state) {
    throw new Error('[WechatPay] 回调解密内容缺少必需字段');
  }

  return {
    out_trade_no: data.out_trade_no,
    transaction_id: data.transaction_id,
    trade_state: data.trade_state,
    amount_total: data.amount?.payer_total ?? data.amount?.total ?? 0,
    payer_openid: data.payer?.openid,
  };
}
