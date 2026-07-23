import { createEntitlementService } from '../../entitlement/entitlementService'
import { getProductById } from '../../entitlement/productCatalog'
import type { Entitlement, EntitlementCode } from '../../entitlement/entitlementTypes'

export function grantEntitlements(userId: string, productId: string): Entitlement[] {
  const product = getProductById(productId)
  if (!product) {
    throw new Error(`Product not found: ${productId}`)
  }

  const entitlementService = createEntitlementService()
  const granted: Entitlement[] = []

  for (const grant of product.grants) {
    const expireAt = grant.durationDays
      ? new Date(Date.now() + grant.durationDays * 24 * 60 * 60 * 1000).toISOString()
      : null

    entitlementService.grant(userId, {
      code: grant.code as EntitlementCode,
      source: 'purchase',
      expireAt,
      remaining: grant.quantity,
      orderId: productId
    })

    granted.push({
      code: grant.code as EntitlementCode,
      source: 'purchase',
      expireAt,
      remaining: grant.quantity,
      orderId: productId,
      grantedAt: new Date().toISOString()
    })
  }

  return granted
}
