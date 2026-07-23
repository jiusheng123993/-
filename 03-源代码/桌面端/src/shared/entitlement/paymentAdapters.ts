/**
 * PaymentAdapters - 支付渠道适配器
 *
 * 职责：
 * - 封装三方支付 API 的差异（微信/Apple/支付宝）
 * - 对外统一接口：createPayment / verifyPayment
 * - 不写入任何密钥、证书、商户号（由部署环境注入）
 *
 * 安全：
 * - 当前为模拟实现，开发环境返回模拟支付结果
 * - 生产环境需替换为真实 SDK 调用，密钥从环境变量读取
 * - rawReceipt 仅用于服务端对账，不向前端暴露
 *
 * 扩展：
 * - 新增渠道：在 PaymentChannel 联合类型追加 + 此文件追加实现
 * - 新增能力（如退款、订阅管理）：在 PaymentAdapter 接口追加方法
 */

import type { OrderPaymentChannel } from './orderTypes'

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

function generateMockPaymentId(channel: string, orderId: string): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `mock-${channel}-${orderId}-${ts}-${rand}`
}

function generateMockTradeNo(channel: string, orderId: string): string {
  const ts = Date.now().toString(36)
  return `trade-${channel}-${orderId}-${ts}`
}

/**
 * 支付适配器统一接口
 */
export interface PaymentAdapter {
  /** 发起支付，返回支付 ID 和可选的跳转链接/二维码 */
  createPayment(orderId: string, amount: number): Promise<PaymentResult>
  /** 验证支付结果，返回是否成功和渠道交易号 */
  verifyPayment(paymentId: string): Promise<VerificationResult>
}

export interface PaymentResult {
  paymentId: string
  paymentUrl?: string
  qrCode?: string
}

export interface VerificationResult {
  success: boolean
  tradeNo?: string
  rawReceipt?: string
}

function createMockAdapter(channel: OrderPaymentChannel): PaymentAdapter {
  return {
    async createPayment(orderId: string, amount: number): Promise<PaymentResult> {
      if (isProduction()) {
        throw new Error(`PaymentAdapter[${channel}].createPayment: 生产环境需接入真实支付 SDK`)
      }
      const paymentId = generateMockPaymentId(channel, orderId)
      return {
        paymentId,
        paymentUrl: `/mock-payment?channel=${channel}&orderId=${orderId}&amount=${amount}&paymentId=${paymentId}`,
        qrCode: `mock-qr-${channel}-${orderId}`
      }
    },

    async verifyPayment(paymentId: string): Promise<VerificationResult> {
      if (isProduction()) {
        throw new Error(`PaymentAdapter[${channel}].verifyPayment: 生产环境需接入真实支付 SDK`)
      }
      const orderId = paymentId.includes('-')
        ? paymentId.split('-').slice(2, -2).join('-')
        : paymentId
      return {
        success: true,
        tradeNo: generateMockTradeNo(channel, orderId),
        rawReceipt: JSON.stringify({
          channel,
          paymentId,
          verifiedAt: new Date().toISOString(),
          mock: true
        })
      }
    }
  }
}

/**
 * 支付渠道适配器注册表。
 * 当前为模拟实现，开发环境返回模拟支付结果。
 * 接入真实支付 SDK 时，替换对应渠道的 createPayment / verifyPayment 实现即可。
 */
export const paymentAdapters: Record<OrderPaymentChannel, PaymentAdapter> = {
  wechat: createMockAdapter('wechat'),
  apple: createMockAdapter('apple'),
  alipay: createMockAdapter('alipay')
}

/**
 * 获取指定渠道的支付适配器。
 * 不存在的渠道会抛错，防止静默降级。
 */
export function getPaymentAdapter(channel: OrderPaymentChannel): PaymentAdapter {
  const adapter = paymentAdapters[channel]
  if (!adapter) {
    throw new Error(`PaymentAdapter: unsupported channel: ${channel}`)
  }
  return adapter
}
