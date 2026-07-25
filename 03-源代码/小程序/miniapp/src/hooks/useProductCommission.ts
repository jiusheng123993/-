import { useState, useCallback, useRef } from 'react'
import {
  recordClick,
  recordConversion,
  getCommissionStats,
  type CommissionStats,
} from '../services/commissionService'
import {
  getProductById,
  buildAffiliateLink,
  getRecommendedProducts,
  type PetProduct,
  type ProductRecommendationContext,
} from '../data/petProducts'

export interface UseProductCommissionOptions {
  userId: string
  sourcePage: string
}

export function useProductCommission(options: UseProductCommissionOptions) {
  const [stats, setStats] = useState<CommissionStats | null>(null)
  const clickIdRef = useRef<string | null>(null)
  const trackedRef = useRef(false)

  const trackClick = useCallback((product: PetProduct) => {
    if (!product || !product.affiliateUrl) return

    const clickId = recordClick({
      partnerId: product.id,
      userId: options.userId,
      sourcePage: options.sourcePage,
      partnerType: 'ecommerce',
    })
    clickIdRef.current = clickId
  }, [options.userId, options.sourcePage])

  const trackPurchase = useCallback((product: PetProduct) => {
    if (!clickIdRef.current) return

    recordConversion({
      partnerId: product.id,
      clickId: clickIdRef.current,
      userId: options.userId,
      conversionType: 'purchase',
      orderAmount: product.price,
    })
  }, [options.userId])

  const handleProductClick = useCallback((product: PetProduct) => {
    trackClick(product)
    const link = buildAffiliateLink(product, options.userId)
    trackedRef.current = true
    return link
  }, [options.userId, trackClick])

  const handlePurchaseConfirm = useCallback((product: PetProduct) => {
    trackPurchase(product)
  }, [trackPurchase])

  const getRecommendations = useCallback((context: ProductRecommendationContext, limit = 6): PetProduct[] => {
    return getRecommendedProducts(context, limit)
  }, [])

  const estimateCommission = useCallback((product: PetProduct): number => {
    return Math.round(product.price * product.commissionRate * 100) / 100
  }, [])

  const refreshStats = useCallback(() => {
    const result = getCommissionStats(options.userId)
    setStats(result)
  }, [options.userId])

  return {
    stats,
    handleProductClick,
    handlePurchaseConfirm,
    getRecommendations,
    estimateCommission,
    refreshStats,
  }
}