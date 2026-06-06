/**
 * PaymentAdapters - 支付渠道适配器
 *
 * 职责：
 * - 封装三方支付 API 的差异（微信/Apple/支付宝）
 * - 对外统一接口：createPayment / verifyPayment
 * - 不写入任何密钥、证书、商户号（由部署环境注入）
 *
 * 安全：
 * - 当前为未实现占位，所有方法均抛出明确错误，防止静默返回假数据
 * - 生产环境需替换为真实 SDK 调用，密钥从环境变量读取
 * - rawReceipt 仅用于服务端对账，不向前端暴露
 *
 * 扩展：
 * - 新增渠道：在 PaymentChannel 联合类型追加 + 此文件追加实现
 * - 新增能力（如退款、订阅管理）：在 PaymentAdapter 接口追加方法
 */

import type { OrderPaymentChannel } from './orderTypes'

class PaymentNotImplementedError extends Error {
  constructor(channel: string, method: string) {
    super(`PaymentAdapter[${channel}].${method}: 支付渠道尚未接入，请联系管理员配置`)
    this.name = 'PaymentNotImplementedError'
  }
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

function notImplemented(channel: string, method: string): never {
  throw new PaymentNotImplementedError(channel, method)
}

/**
 * 支付渠道适配器注册表。
 * 当前所有渠道均为未实现占位，调用任何方法均抛出 PaymentNotImplementedError。
 * 接入真实支付 SDK 时，替换对应渠道的 createPayment / verifyPayment 实现即可。
 */
export const paymentAdapters: Record<OrderPaymentChannel, PaymentAdapter> = {
  wechat: {
    async createPayment(_orderId: string, _amount: number): Promise<PaymentResult> {
      notImplemented('wechat', 'createPayment')
    },
    async verifyPayment(_paymentId: string): Promise<VerificationResult> {
      notImplemented('wechat', 'verifyPayment')
    }
  },
  apple: {
    async createPayment(_orderId: string, _amount: number): Promise<PaymentResult> {
      notImplemented('apple', 'createPayment')
    },
    async verifyPayment(_paymentId: string): Promise<VerificationResult> {
      notImplemented('apple', 'verifyPayment')
    }
  },
  alipay: {
    async createPayment(_orderId: string, _amount: number): Promise<PaymentResult> {
      notImplemented('alipay', 'createPayment')
    },
    async verifyPayment(_paymentId: string): Promise<VerificationResult> {
      notImplemented('alipay', 'verifyPayment')
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
