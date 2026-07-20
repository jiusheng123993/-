/**
 * Product 类型契约 - 商品目录数据契约
 *
 * 商品（Product）是用户实际购买的对象，包含定价、支付渠道、授予的权益（grants）。
 * 商品配置驱动 SubscriptionProvider / AiQuotaProvider 的具体授权动作。
 */

import type { EntitlementCode } from './entitlementTypes'

/** 订阅周期 */
export type ProductPeriod = 'month' | 'quarter' | 'year'
/** 商品类型：订阅 / 一次性 / 加油包 */
export type ProductType = 'subscription' | 'one_time' | 'pack'
/** 支付渠道 */
export type PaymentChannel = 'wechat' | 'apple' | 'alipay'

/**
 * 单个权益授予：商品购买后，对应授予 EntitlementCode
 * - durationDays：有效期（按天计算）；未填表示永久
 * - quantity：配额数量（仅配额类权益使用）
 * - scope：细分范围（如 themeId、templateId）
 */
export interface ProductGrant {
  code: EntitlementCode
  durationDays?: number
  quantity?: number
  scope?: string
}

/**
 * 商品定义
 * - price / originalPrice 单位为「分」，避免浮点精度问题
 * - visibleFrom / visibleTo 用于上下架时间窗
 * - active=false 立即下架（不参与购买流程）
 */
export interface Product {
  id: string
  name: string
  type: ProductType
  period?: ProductPeriod
  /** 价格（单位：分） */
  price: number
  /** 原价（划线价，单位：分），用于展示首发优惠等 */
  originalPrice?: number
  grants: ProductGrant[]
  channel: PaymentChannel[]
  active: boolean
  /** 上架时间 ISO 字符串，到点前对用户不可见 */
  visibleFrom?: string
  /** 下架时间 ISO 字符串，到点后对用户不可见 */
  visibleTo?: string
}
