/**
 * Order 类型契约 - 订单数据契约
 *
 * 订单是用户购买商品的凭证，关联 Product 和 PaymentChannel。
 * 状态机：pending → paid → refunded
 *                 └→ failed
 *
 * 安全：
 * - rawReceipt 存放三方支付原始回执，仅用于对账，不向前端暴露
 * - channelTradeNo 由支付渠道返回，用于退款和审计
 */

/** 订单状态枚举 */
export type OrderStatus = 'pending' | 'paid' | 'refunded' | 'failed'

/** 支付渠道（与 ProductTypes.PaymentChannel 保持一致） */
export type OrderPaymentChannel = 'wechat' | 'apple' | 'alipay'

/**
 * 订单实体
 * @property id 系统生成的唯一订单号
 * @property userId 用户 ID
 * @property productId 商品 ID（关联 ProductCatalog）
 * @property amount 金额（单位：分）
 * @property channel 支付渠道
 * @property status 当前状态
 * @property channelTradeNo 支付渠道交易号（支付成功后回填）
 * @property rawReceipt 三方支付原始回执（仅对账用，不暴露给前端）
 * @property createdAt 创建时间
 * @property paidAt 支付完成时间
 * @property refundedAt 退款时间
 */
export interface Order {
  id: string
  userId: string
  productId: string
  amount: number
  channel: OrderPaymentChannel
  status: OrderStatus
  channelTradeNo?: string
  rawReceipt?: string
  createdAt: string
  paidAt?: string
  refundedAt?: string
}

/**
 * 创建订单参数
 */
export interface CreateOrderParams {
  userId: string
  productId: string
  amount: number
  channel: OrderPaymentChannel
}
