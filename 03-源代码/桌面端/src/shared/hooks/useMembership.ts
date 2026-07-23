import { useState, useMemo, useCallback } from 'react'
import { createEntitlementService } from '../entitlement/entitlementService'
import { createAiQuotaProvider } from '../entitlement/aiQuotaProvider'
import { getActiveProducts, type Product } from '../entitlement/productCatalog'

interface Trial {
  code: string
  expireAt: string
  used: boolean
}

interface Coupon {
  code: string
  type: string
  discount: number
  used: boolean
}

export function useMembership(userId: string | undefined) {
  const entitlementService = useMemo(() => createEntitlementService(), [])
  const aiQuotaProvider = useMemo(() => createAiQuotaProvider(entitlementService), [entitlementService])
  const [trials, setTrials] = useState<Trial[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])

  const isMember = useMemo(() => {
    if (!userId) return false
    return entitlementService.has(userId, 'study') ||
           entitlementService.has(userId, 'agent') ||
           entitlementService.has(userId, 'agent_plus')
  }, [userId, entitlementService])

  const currentTier = useMemo(() => {
    if (!userId) return { level: 'free', label: '免费用户', color: '#94a3b8' }
    if (entitlementService.has(userId, 'agent_plus')) return { level: 'agent_plus', label: 'Agent PLUS', color: '#8b5cf6' }
    if (entitlementService.has(userId, 'agent')) return { level: 'agent', label: 'Agent 会员', color: '#6366f1' }
    if (entitlementService.has(userId, 'study')) return { level: 'study', label: '学习会员', color: '#10b981' }
    return { level: 'free', label: '免费用户', color: '#94a3b8' }
  }, [userId, entitlementService])

  const quotaStatus = aiQuotaProvider.getQuotaStatus(userId)

  const totalQuota = useMemo(() => {
    return (
      (quotaStatus.free?.remaining || 0) +
      (quotaStatus.study?.remaining || 0) +
      (quotaStatus.agent?.remaining || 0) +
      (quotaStatus.pack?.remaining || 0)
    )
  }, [quotaStatus])

  const hasActiveTrial = useCallback((code: string) => {
    return trials.some(t => t.code === code && !t.used)
  }, [trials])

  const startTrial = useCallback((trialCode: string, durationDays: number) => {
    const expireTime = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
    const newTrial: Trial = {
      code: trialCode,
      expireAt: expireTime,
      used: false
    }
    setTrials(prev => [...prev, newTrial])
    entitlementService.grant(userId, {
      code: trialCode as 'study' | 'agent' | 'agent_plus',
      source: 'trial',
      expireAt: expireTime
    })
  }, [userId, entitlementService])

  const redeemCoupon = useCallback((code: string) => {
    if (!code.trim()) return { success: false, message: '请输入优惠券码' }
    
    const validCoupons: Record<string, { type: string; discount: number }> = {
      'WELCOME10': { type: 'percent', discount: 10 },
      'NEWUSER50': { type: 'amount', discount: 50 },
      'AGENT2024': { type: 'percent', discount: 20 },
      'VIP888': { type: 'amount', discount: 100 }
    }
    
    const coupon = validCoupons[code.toUpperCase()]
    if (coupon) {
      setCoupons(prev => [...prev, { code: code.toUpperCase(), ...coupon, used: false }])
      return { success: true, message: `优惠券 ${code} 兑换成功！` }
    }
    return { success: false, message: '优惠券码无效' }
  }, [])

  const products = useMemo(() => getActiveProducts(), [])

  const getProductsByTier = useCallback((tier: 'study' | 'agent' | 'agent_plus') => {
    const tierProducts = products.filter(p => {
      if (tier === 'study') return p.id.startsWith('study')
      if (tier === 'agent') return p.id.startsWith('agent') && !p.id.includes('plus')
      if (tier === 'agent_plus') return p.id.includes('plus')
      return false
    })

    const periods = ['month', 'quarter', 'year'] as const
    return periods.map(period => {
      const filtered = tierProducts.filter(p => p.period === period)
      return filtered.find(p => p.originalPrice) ?? filtered[0]
    }).filter(Boolean) as Product[]
  }, [products])

  const formatPrice = useCallback((cents: number) => `¥${(cents / 100).toFixed(0)}`, [])

  const getPeriodLabel = useCallback((period: string) => {
    const map: Record<string, string> = { month: '月', quarter: '季', year: '年' }
    return map[period] || period
  }, [])

  const getTierInfo = useCallback((tier: string) => {
    const map: Record<string, { name: string; badge: string; color: string; features: string[] }> = {
      study: { name: '学习会员', badge: '基础', color: '#10b981', features: ['高级主题全解锁', '云同步', '高级统计', '50次AI额度/月'] },
      agent: { name: 'Agent 会员', badge: '热门', color: '#6366f1', features: ['有记忆的AI搭子', '自我进化机制', '角色系统', 'RPM捏脸', '200次AI额度/月'] },
      agent_plus: { name: 'Agent PLUS', badge: '旗舰', color: '#8b5cf6', features: ['AI 3D角色生成', '实时反思', '工具调用能力', '角色进化全解锁', '无限AI额度'] }
    }
    return map[tier] || { name: tier, badge: '', color: '#6366f1', features: [] }
  }, [])

  const getGrantLabel = useCallback((code: string) => {
    const map: Record<string, string> = {
      study: '学习会员',
      agent: 'Agent 会员',
      agent_plus: 'Agent PLUS',
      avatar_rpm: 'RPM捏脸',
      memory_sync: '记忆同步',
      evolution_ritual: '进化仪式',
      avatar_evolution: '角色进化',
      evolution_realtime: '实时反思',
      agent_tool_call: '工具调用'
    }
    return map[code] || code
  }, [])

  return {
    isMember,
    currentTier,
    quotaStatus,
    totalQuota,
    trials,
    coupons,
    products,
    hasActiveTrial,
    startTrial,
    redeemCoupon,
    getProductsByTier,
    formatPrice,
    getPeriodLabel,
    getTierInfo,
    getGrantLabel,
    has: entitlementService.has.bind(entitlementService)
  }
}
