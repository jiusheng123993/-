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

  // 真实模式：GET /v3/pay/transactions/outtrade/{out_trade_no}
  // 完整实现需调用微信 API，此处保留框架
  throw new Error('[WechatPay] 真实模式 queryOrder 暂未实现，请配置 WECHAT_PAY_MOCK=true 或补充微信 SDK');
}

/**
 * 退款
 * @param orderId - 我方订单号
 * @param amount - 退款金额（分，应等于支付金额）
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
  // 完整实现需调用微信 API
  throw new Error('[WechatPay] 真实模式 refund 暂未实现，请配置 WECHAT_PAY_MOCK=true 或补充微信 SDK');
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

// ===== 真实模式实现（框架，待接入真实微信支付 SDK） =====

/**
 * 真实模式创建 JSAPI 支付
 * 调用微信支付 V3 API：POST /v3/pay/transactions/jsapi
 *
 * TODO 待接入真实微信支付时实现：
 *   1. 构造请求体（appid、mchid、description、out_trade_no、amount、payer）
 *   2. 计算签名（SHA256-RSA2048）
 *   3. 发送 HTTP 请求，附带 Authorization 头
 *   4. 解析 prepay_id
 *   5. 计算 wx.requestPayment 所需的 paySign
 */
async function createRealJsapiPayment(
  _orderId: string,
  _amount: number,
  _description: string,
  _openid: string,
): Promise<JsapiPaymentParams> {
  throw new Error(
    '[WechatPay] 真实模式 createJsapiPayment 暂未实现。请配置 WECHAT_PAY_MOCK=true 进行开发，或接入 wechatpay-node-v3 SDK 后补充实现',
  );
}

/**
 * 真实模式验签 + 解密回调
 *
 * TODO 待接入真实微信支付时实现：
 *   1. 校验 Wechatpay-Serial 是否为平台证书序列号
 *   2. 用平台证书公钥验签（signature 是对 timestamp\nnonce\nbody 的 SHA256-RSA2048 签名）
 *   3. 用 apiV3Key 解密 resource.ciphertext（AES-256-GCM，associated_data = resource.associated_data, nonce = resource.nonce）
 *   4. 返回结构化结果
 */
async function verifyAndDecodeRealNotify(
  _timestamp: string,
  _nonce: string,
  _serial: string,
  _signature: string,
  _rawBody: string,
): Promise<WechatNotifyResult> {
  throw new Error(
    '[WechatPay] 真实模式 verifyAndDecodeNotify 暂未实现。请配置 WECHAT_PAY_MOCK=true 进行开发，或接入 wechatpay-node-v3 SDK 后补充实现',
  );
}
