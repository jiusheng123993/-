/**
 * PaymentAdapters - 支付渠道适配器
 *
 * 职责：
 * - 封装三方支付 API 的差异（微信/Apple/支付宝）
 * - 对外统一接口：createPayment / verifyPayment
 * - 不写入任何密钥、证书、商户号（由部署环境注入）
 *
 * 安全：
 * - 所有 TODO 占位处仅返回模拟数据，不包含真实 API 调用
 * - 生产环境需替换为真实 SDK 调用，密钥从环境变量读取
 * - rawReceipt 仅用于服务端对账，不向前端暴露
 *
 * 扩展：
 * - 新增渠道：在 PaymentChannel 联合类型追加 + 此文件追加实现
 * - 新增能力（如退款、订阅管理）：在 PaymentAdapter 接口追加方法
 */

import type { OrderPaymentChannel } from './orderTypes'

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

/**
 * 支付渠道适配器注册表。
 * 当前为 TODO 占位实现，生产环境需替换为真实 SDK。
 */
export const paymentAdapters: Record<OrderPaymentChannel, PaymentAdapter> = {
  wechat: {
    async createPayment(orderId: string, amount: number): Promise<PaymentResult> {
      void amount
      return {
        paymentId: `wx-${orderId}`,
        qrCode: `weixin://wxpay/bizpayurl?pr=${orderId}`
      }
    },
    async verifyPayment(paymentId: string): Promise<VerificationResult> {
      return { success: true, tradeNo: paymentId }
    }
  },
  apple: {
    async createPayment(orderId: string, amount: number): Promise<PaymentResult> {
      void amount
      return { paymentId: `apple-${orderId}` }
    },
    async verifyPayment(paymentId: string): Promise<VerificationResult> {
      return { success: true, tradeNo: paymentId }
    }
  },
  alipay: {
    async createPayment(orderId: string, amount: number): Promise<PaymentResult> {
      void amount
      return {
        paymentId: `ali-${orderId}`,
        paymentUrl: `https://qr.alipay.com/${orderId}`
      }
    },
    async verifyPayment(paymentId: string): Promise<VerificationResult> {
      return { success: true, tradeNo: paymentId }
    }
  }
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
