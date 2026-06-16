import { useMemo, useCallback } from 'react'
import type { Product } from '../entitlement/productTypes'
import { getActiveProducts } from '../entitlement/productCatalog'
import { paymentAdapters } from '../entitlement/paymentAdapters'
import { aiQuotaProvider } from '../services/instances'
import { entitlementService } from '../services/instances'
import { orderService } from '../services/instances'

export interface MembershipFlowState {
  quotaStatus: ReturnType<typeof aiQuotaProvider.getQuotaStatus>
  totalQuota: number
  currentTier: { level: string; label: string; color: string }
  products: Product[]
  studyProducts: Product[]
  agentProducts: Product[]
  agentPlusProducts: Product[]
  userOrders: ReturnType<typeof orderService.getOrdersByUser>
  selectedProduct: Product | null
  setSelectedOrder: (order: ReturnType<typeof orderService.getOrdersByUser>[number] | null) => void
  userCoupons: { code: string; type: string; discount: number; used: boolean }[]
  userTrials: { code: string; expireAt: string; used: boolean }[]
  handleSwitchRole: () => void
  handleSubscribe: (product: Product) => void
  handlePayment: (channel: 'wechat' | 'alipay' | 'apple') => Promise<void>
  hasActiveTrial: (code: string) => boolean
  handleStartTrial: (trialCode: string, durationDays: number) => void
  handleRedeemCoupon: (code: string) => void
  handleRefundOrder: (orderId: string) => void
  getProductName: (productId: string) => string
  getChannelLabel: (channel: string) => string
  getStatusLabel: (status: string) => string
  getStatusColor: (status: string) => string
  formatPrice: (cents: number) => string
  getPeriodLabel: (period: string) => string
  getTierInfo: (tier: string) => { name: string; badge: string; color: string; features: string[] }
  getGrantLabel: (code: string) => string
}

interface UseMembershipFlowParams {
  userId: string
  role: string
  switchRole: () => void
  addToast: (toast: { type: string; title: string; message?: string }) => void
  selectedProduct: Product | null
  setSelectedProduct: (product: Product) => void
  setIsPaymentOpen: (open: boolean) => void
  setIsMembershipOpen: (open: boolean) => void
  selectedOrder: ReturnType<typeof orderService.getOrdersByUser>[number] | null
  setSelectedOrder: (order: ReturnType<typeof orderService.getOrdersByUser>[number] | null) => void
  userTrials: { code: string; expireAt: string; used: boolean }[]
  setUserTrials: React.Dispatch<React.SetStateAction<{ code: string; expireAt: string; used: boolean }[]>>
  userCoupons: { code: string; type: string; discount: number; used: boolean }[]
  setUserCoupons: React.Dispatch<React.SetStateAction<{ code: string; type: string; discount: number; used: boolean }[]>>
}

export function useMembershipFlow({
  userId,
  role,
  switchRole,
  addToast,
  selectedProduct,
  setSelectedProduct,
  setIsPaymentOpen,
  setIsMembershipOpen,
  selectedOrder: _selectedOrder,
  setSelectedOrder,
  userTrials,
  setUserTrials,
  userCoupons,
  setUserCoupons
}: UseMembershipFlowParams): MembershipFlowState {
  const quotaStatus = useMemo(() => aiQuotaProvider.getQuotaStatus(userId), [userId])
  const totalQuota = useMemo(() =>
    (quotaStatus.free?.remaining || 0) +
    (quotaStatus.study?.remaining || 0) +
    (quotaStatus.agent?.remaining || 0) +
    (quotaStatus.pack?.remaining || 0)
  , [quotaStatus])

  const currentTier = useMemo(() => {
    if (entitlementService.has(userId, 'agent_plus')) return { level: 'agent_plus', label: 'Agent PLUS', color: '#8b5cf6' }
    if (entitlementService.has(userId, 'agent')) return { level: 'agent', label: 'Agent 会员', color: '#6366f1' }
    if (entitlementService.has(userId, 'study')) return { level: 'study', label: '学习会员', color: '#10b981' }
    return { level: 'free', label: '免费用户', color: 'var(--muted, #94a3b8)' }
  }, [userId])

  const products = useMemo(() => getActiveProducts(), [])

  const getProductsByTier = (tier: 'study' | 'agent' | 'agent_plus') => {
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
  }

  const studyProducts = getProductsByTier('study')
  const agentProducts = getProductsByTier('agent')
  const agentPlusProducts = getProductsByTier('agent_plus')

  const formatPrice = (cents: number) => `¥${(cents / 100).toFixed(0)}`

  const getPeriodLabel = (period: string) => {
    const map: Record<string, string> = { month: '月', quarter: '季', year: '年' }
    return map[period] || period
  }

  const getTierInfo = (tier: string) => {
    const map: Record<string, { name: string; badge: string; color: string; features: string[] }> = {
      study: { name: '学习会员', badge: '基础', color: '#10b981', features: ['高级主题全解锁', '云同步', '高级统计', '50次AI额度/月'] },
      agent: { name: 'Agent 会员', badge: '热门', color: '#6366f1', features: ['有记忆的AI搭子', '自我进化机制', '角色系统', 'RPM捏脸', '200次AI额度/月'] },
      agent_plus: { name: 'Agent PLUS', badge: '旗舰', color: '#8b5cf6', features: ['AI 3D角色生成', '实时反思', '工具调用能力', '角色进化全解锁', '无限AI额度'] }
    }
    return map[tier] || { name: tier, badge: '', color: '#6366f1', features: [] }
  }

  const getGrantLabel = (code: string) => {
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
  }

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId)
    return product?.name || productId
  }

  const getChannelLabel = (channel: string) => {
    const map: Record<string, string> = { wechat: '微信', alipay: '支付宝', apple: 'Apple Pay' }
    return map[channel] || channel
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = { pending: '待支付', paid: '已支付', refunded: '已退款', failed: '失败' }
    return map[status] || status
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = { pending: '#f59e0b', paid: '#10b981', refunded: 'var(--muted, #6b7280)', failed: '#ef4444' }
    return map[status] || 'var(--muted, #6b7280)'
  }

  const handleSwitchRole = useCallback(() => {
    switchRole()
    addToast({
      type: 'info',
      title: '角色已切换',
      message: `当前角色：${role === 'admin' ? '用户' : '管理员'}`
    })
  }, [switchRole, addToast, role])

  const handleSubscribe = useCallback((product: Product) => {
    setSelectedProduct(product)
    setIsPaymentOpen(true)
  }, [setSelectedProduct, setIsPaymentOpen])

  const handlePayment = useCallback(async (channel: 'wechat' | 'alipay' | 'apple') => {
    if (!selectedProduct) return

    const order = orderService.createOrder({
      userId,
      productId: selectedProduct.id,
      amount: selectedProduct.price,
      channel
    })

    const adapter = paymentAdapters[channel]
    const result = await adapter.createPayment(order.id, order.amount)

    if (result.qrCode) {
      window.open(result.qrCode, '_blank')
    } else if (result.paymentUrl) {
      window.open(result.paymentUrl, '_blank')
    }

    setIsPaymentOpen(false)
    setIsMembershipOpen(false)
    addToast({
      type: 'success',
      title: '订单已创建',
      message: `订单号：${order.id}，请在打开的页面中完成支付，支付完成后刷新页面查看会员状态。`
    })
  }, [selectedProduct, userId, setIsPaymentOpen, setIsMembershipOpen, addToast])

  const userOrders = useMemo(() => {
    return orderService.getOrdersByUser(userId).slice(0, 5)
  }, [userId])

  const hasActiveTrial = useCallback((code: string) => {
    return userTrials.some(t => t.code === code && !t.used)
  }, [userTrials])

  const handleStartTrial = useCallback((trialCode: string, durationDays: number) => {
    const expireTime = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
    const newTrial = {
      code: trialCode,
      expireAt: expireTime,
      used: false
    }
    setUserTrials(prev => [...prev, newTrial])
    entitlementService.grant(userId, {
      code: trialCode as 'study' | 'agent' | 'agent_plus',
      source: 'trial',
      expireAt: expireTime
    })
    addToast({
      type: 'success',
      title: '试用已开启',
      message: `您将享受 ${durationDays} 天的会员权益。`
    })
  }, [userId, setUserTrials, addToast])

  const handleRedeemCoupon = useCallback((code: string) => {
    if (!code.trim()) {
      addToast({ type: 'warning', title: '请输入优惠券码' })
      return
    }
    const validCoupons: Record<string, {type: string; discount: number}> = {
      'WELCOME10': { type: 'percent', discount: 10 },
      'NEWUSER50': { type: 'amount', discount: 50 },
      'AGENT2024': { type: 'percent', discount: 20 },
      'VIP888': { type: 'amount', discount: 100 }
    }
    const coupon = validCoupons[code.toUpperCase()]
    if (coupon) {
      setUserCoupons(prev => [...prev, { code: code.toUpperCase(), ...coupon, used: false }])
      addToast({ type: 'success', title: '兑换成功', message: `优惠券 ${code.toUpperCase()} 已添加到您的账户。` })
    } else {
      addToast({ type: 'error', title: '优惠券码无效' })
    }
  }, [setUserCoupons, addToast])

  const handleRefundOrder = useCallback((orderId: string) => {
    try {
      orderService.markAsRefunded(orderId)
      addToast({ type: 'success', title: '退款申请已提交', message: '请耐心等待处理。' })
    } catch (e) {
      addToast({ type: 'error', title: '退款失败', message: e instanceof Error ? e.message : '未知错误' })
    }
  }, [addToast])

  return {
    quotaStatus,
    totalQuota,
    currentTier,
    products,
    studyProducts,
    agentProducts,
    agentPlusProducts,
    userOrders,
    selectedProduct,
    setSelectedOrder,
    userCoupons,
    userTrials,
    handleSwitchRole,
    handleSubscribe,
    handlePayment,
    hasActiveTrial,
    handleStartTrial,
    handleRedeemCoupon,
    handleRefundOrder,
    getProductName,
    getChannelLabel,
    getStatusLabel,
    getStatusColor,
    formatPrice,
    getPeriodLabel,
    getTierInfo,
    getGrantLabel
  }
}
