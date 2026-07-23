/**
 * SubscriptionProvider - 订阅与一次性购买的权益激活桥接层
 *
 * 职责：
 * - 将 Product 配置（grants）转换为对 EntitlementService 的 grant 调用
 * - 提供订阅生命周期管理：activate / deactivate / renew / getStatus
 * - 自动根据 Product.period 推导 EntitlementSource（月/季/年/一次性）
 *
 * 设计要点：
 * - 不直接处理支付，假设上层已确认订单成功
 * - renew 语义：先回收旧权益，再发放新权益，保证不会出现重复条目
 * - 业务层永远只需 `entitlementService.has(code)`，无需关心订阅来源
 */

import type { EntitlementService } from './entitlementService'
import type { EntitlementSource } from './entitlementTypes'
import { getProductById } from './productCatalog'
import type { Product, ProductPeriod } from './productTypes'

export interface SubscriptionStatus {
  active: boolean
  expireAt: string | null
  orderId?: string
}

export interface SubscriptionProvider {
  /** 激活订阅：根据 productId 授予全部 grants */
  activate(userId: string, productId: string, orderId: string): void
  /** 撤销某权益（一般用于退款或主动取消） */
  deactivate(userId: string, code: string): void
  /** 续费：先撤销旧权益，再激活新订阅 */
  renew(userId: string, productId: string, orderId: string): void
  /** 查询某权益的订阅状态 */
  getStatus(userId: string, code: string): SubscriptionStatus
}

/**
 * 将商品周期映射到权益来源标签。
 * - month → sub_monthly
 * - quarter → sub_quarterly
 * - year → sub_yearly
 * - 一次性购买/加油包：one_time_purchase
 */
function deriveSource(product: Product): EntitlementSource {
  const map: Record<ProductPeriod, EntitlementSource> = {
    month: 'sub_monthly',
    quarter: 'sub_quarterly',
    year: 'sub_yearly'
  }
  if (product.type === 'subscription' && product.period) {
    return map[product.period]
  }
  if (product.type === 'pack') {
    return 'ai_pack'
  }
  return 'one_time_purchase'
}

/**
 * 创建订阅提供者工厂，注入 EntitlementService 实例。
 */
export function createSubscriptionProvider(
  entitlementService: EntitlementService
): SubscriptionProvider {
  const requireProduct = (productId: string): Product => {
    const product = getProductById(productId)
    if (!product) {
      throw new Error(`SubscriptionProvider: unknown productId: ${productId}`)
    }
    return product
  }

  const grantAll = (userId: string, product: Product, orderId: string) => {
    const source = deriveSource(product)
    product.grants.forEach((grant) => {
      const expireAt = grant.durationDays
        ? new Date(Date.now() + grant.durationDays * 24 * 60 * 60 * 1000).toISOString()
        : null
      entitlementService.grant(userId, {
        code: grant.code,
        source,
        expireAt,
        scope: grant.scope,
        remaining: grant.quantity,
        orderId
      })
    })
  }

  return {
    activate(userId: string, productId: string, orderId: string): void {
      if (!userId) throw new Error('SubscriptionProvider.activate: userId is required')
      if (!productId) throw new Error('SubscriptionProvider.activate: productId is required')
      if (!orderId) throw new Error('SubscriptionProvider.activate: orderId is required')

      const product = requireProduct(productId)
      grantAll(userId, product, orderId)
    },

    deactivate(userId: string, code: string): void {
      if (!userId || !code) return
      entitlementService.revoke(userId, (e) => e.code === code)
    },

    renew(userId: string, productId: string, orderId: string): void {
      if (!userId) throw new Error('SubscriptionProvider.renew: userId is required')
      if (!productId) throw new Error('SubscriptionProvider.renew: productId is required')

      const product = requireProduct(productId)
      // 先撤销该商品涉及的所有权益，避免重复条目
      product.grants.forEach((grant) => {
        entitlementService.revoke(userId, (e) => e.code === grant.code)
      })
      grantAll(userId, product, orderId)
    },

    getStatus(userId: string, code: string): SubscriptionStatus {
      const entitlements = entitlementService.list(userId)
      const entitlement = entitlements.find((e) => e.code === code)
      if (!entitlement) {
        return { active: false, expireAt: null }
      }
      return {
        active: entitlementService.has(userId, entitlement.code),
        expireAt: entitlement.expireAt,
        orderId: entitlement.orderId
      }
    }
  }
}
