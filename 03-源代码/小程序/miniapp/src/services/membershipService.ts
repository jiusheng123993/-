import Taro from '@tarojs/taro'
import { getStorage, setStorage } from '../utils/storage'
import { api } from './api'

export type MembershipTier = 'free' | 'member'
export type MembershipPlan = 'monthly' | 'quarterly' | 'yearly'
export type MembershipStatus = 'active' | 'expired' | 'cancelled' | 'none'
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded' | 'paid'

export interface MembershipInfo {
  userId: string
  tier: MembershipTier
  plan: MembershipPlan | null
  status: MembershipStatus
  expiresAt: string | null
  startedAt: string | null
  cancelledAt: string | null
  paymentOrderId: string | null
  price: number | null
}

export interface MembershipPlanConfig {
  plan: MembershipPlan
  label: string
  price: number
  originalPrice: number
  discountLabel: string
  durationDays: number
}

export interface MembershipBenefit {
  featureKey: string
  featureName: string
  freeValue: string
  memberValue: string
  isHighlight: boolean
}

export interface PaymentOrder {
  id: string
  userId: string
  plan: MembershipPlan
  amount: number
  status: PaymentStatus
  channel: 'wechat'
  createdAt: string
  paidAt: string | null
}

export interface WechatPaymentParams {
  appId: string
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
  paySign: string
}

export interface CreateOrderResult {
  orderId: string
  amount: number
  channel: string
  status: string
  createdAt: string
  paymentParams?: WechatPaymentParams
}

const MEMBERSHIP_KEY = 'membership'
const ORDERS_KEY = 'membership_orders'
const PAYWALL_SHOWN_KEY = 'paywall_shown'

export const MEMBERSHIP_PLANS: MembershipPlanConfig[] = [
  { plan: 'monthly', label: '月度会员', price: 9.9, originalPrice: 9.9, discountLabel: '', durationDays: 30 },
  { plan: 'quarterly', label: '季度会员', price: 25.9, originalPrice: 29.7, discountLabel: '省3.8元', durationDays: 90 },
  { plan: 'yearly', label: '年度会员', price: 88, originalPrice: 118.8, discountLabel: '省30.8元', durationDays: 365 },
]

export const MEMBERSHIP_BENEFITS: MembershipBenefit[] = [
  { featureKey: 'pet_count', featureName: '宠物档案', freeValue: '最多2只', memberValue: '最多5只', isHighlight: false },
  { featureKey: 'checkin', featureName: '3秒健康打卡', freeValue: '✅', memberValue: '✅', isHighlight: false },
  { featureKey: 'vaccine', featureName: '疫苗驱虫日历', freeValue: '✅', memberValue: '✅', isHighlight: false },
  { featureKey: 'food_query', featureName: '食物安全查询', freeValue: '每日5次', memberValue: '不限', isHighlight: true },
  { featureKey: 'symptom_check', featureName: 'AI症状初筛', freeValue: '每日2次', memberValue: '不限', isHighlight: true },
  { featureKey: 'health_trend', featureName: '健康趋势图', freeValue: '7天', memberValue: '不限', isHighlight: true },
  { featureKey: 'health_report', featureName: '健康报告导出', freeValue: '❌', memberValue: '✅', isHighlight: false },
  { featureKey: 'chronic_tracking', featureName: '慢性病追踪', freeValue: '❌', memberValue: '✅', isHighlight: false },
  { featureKey: 'feeding_advice', featureName: '个性化喂养建议', freeValue: '❌', memberValue: '✅', isHighlight: false },
]

const FREE_QUOTA_LIMITS: Record<string, number> = {
  checkin: 5,
  food_query: 5,
  symptom_check: 2,
  health_trend: 7,
  pet_count: 2,
}

const MEMBER_QUOTA_LIMITS: Record<string, number> = {
  checkin: Infinity,
  food_query: Infinity,
  symptom_check: Infinity,
  health_trend: Infinity,
  pet_count: 5,
}

function userKey(userId: string, key: string): string {
  return `${key}_${userId}`
}

function generateId(): string {
  return `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function getLocalMembership(userId: string): MembershipInfo {
  const stored = getStorage<MembershipInfo>(userKey(userId, MEMBERSHIP_KEY))
  if (stored) {
    if (stored.tier === 'member' && stored.expiresAt) {
      const expiresAt = new Date(stored.expiresAt).getTime()
      if (Date.now() > expiresAt) {
        const expired: MembershipInfo = {
          ...stored,
          tier: 'free',
          status: 'expired',
        }
        setStorage(userKey(userId, MEMBERSHIP_KEY), expired)
        return expired
      }
    }
    return stored
  }
  return {
    userId,
    tier: 'free',
    plan: null,
    status: 'none',
    expiresAt: null,
    startedAt: null,
    cancelledAt: null,
    paymentOrderId: null,
    price: null,
  }
}

function saveLocalMembership(userId: string, info: MembershipInfo): void {
  setStorage(userKey(userId, MEMBERSHIP_KEY), info)
}

function getLocalOrders(userId: string): PaymentOrder[] {
  return getStorage<PaymentOrder[]>(userKey(userId, ORDERS_KEY)) || []
}

function saveLocalOrders(userId: string, orders: PaymentOrder[]): void {
  setStorage(userKey(userId, ORDERS_KEY), orders)
}

export async function getMembershipStatus(userId: string): Promise<MembershipInfo> {
  if (!userId) throw new Error('[MembershipService] userId is required')
  try {
    const result = await api.get<MembershipInfo>(`/membership?userId=${userId}`)
    saveLocalMembership(userId, result)
    return result
  } catch {
    return getLocalMembership(userId)
  }
}

export async function isMember(userId: string): Promise<boolean> {
  const info = await getMembershipStatus(userId)
  return info.tier === 'member' && info.status === 'active'
}

export async function getQuotaLimit(featureKey: string, userId: string): Promise<number> {
  const memberFlag = await isMember(userId)
  const limits = memberFlag ? MEMBER_QUOTA_LIMITS : FREE_QUOTA_LIMITS
  return limits[featureKey] ?? 0
}

export async function getPetCountLimit(userId: string): Promise<number> {
  return getQuotaLimit('pet_count', userId)
}

export async function createPaymentOrder(userId: string, plan: MembershipPlan): Promise<CreateOrderResult> {
  if (!userId) throw new Error('[MembershipService] userId is required')
  const productId = `membership_${plan}`
  const result = await api.post<CreateOrderResult>('/orders', {
    userId,
    productId,
    channel: 'wechat',
  })
  return result
}

export async function requestWechatPayment(params: WechatPaymentParams): Promise<boolean> {
  return new Promise((resolve) => {
    Taro.requestPayment({
      timeStamp: params.timeStamp,
      nonceStr: params.nonceStr,
      package: params.package,
      signType: params.signType as 'RSA',
      paySign: params.paySign,
      success: () => resolve(true),
      fail: (err) => {
        if (err.errMsg?.includes('cancel')) {
          resolve(false)
        } else {
          resolve(false)
        }
      },
    })
  })
}

export async function pollOrderStatus(orderId: string, maxAttempts: number = 10, interval: number = 2000): Promise<PaymentStatus> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const order = await api.get<{ status: PaymentStatus }>(`/orders/${orderId}`)
      if (order.status === 'success' || order.status === 'paid') {
        return 'success'
      }
      if (order.status === 'failed' || order.status === 'refunded') {
        return order.status
      }
    } catch {
      // continue polling
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  return 'pending'
}

export async function confirmPayment(userId: string, orderId: string): Promise<MembershipInfo> {
  if (!userId) throw new Error('[MembershipService] userId is required')
  const result = await api.post<MembershipInfo>('/membership/payment-callback', { userId, orderId })
  saveLocalMembership(userId, result)
  return result
}

export async function cancelMembership(userId: string): Promise<MembershipInfo> {
  if (!userId) throw new Error('[MembershipService] userId is required')

  try {
    const result = await api.post<MembershipInfo>('/membership/cancel', { userId })
    saveLocalMembership(userId, result)
    return result
  } catch {
    const info = getLocalMembership(userId)
    if (info.tier !== 'member') throw new Error('[MembershipService] Not a member')

    const updated: MembershipInfo = {
      ...info,
      cancelledAt: new Date().toISOString(),
    }
    saveLocalMembership(userId, updated)
    return updated
  }
}

export async function restorePurchase(userId: string): Promise<MembershipInfo> {
  if (!userId) throw new Error('[MembershipService] userId is required')
  try {
    const result = await api.post<MembershipInfo>('/membership/restore', { userId })
    saveLocalMembership(userId, result)
    return result
  } catch {
    return getLocalMembership(userId)
  }
}

export async function getOrders(userId: string): Promise<PaymentOrder[]> {
  if (!userId) throw new Error('[MembershipService] userId is required')
  try {
    const result = await api.get<PaymentOrder[]>(`/membership/orders?userId=${userId}`)
    saveLocalOrders(userId, result)
    return result
  } catch {
    return getLocalOrders(userId)
  }
}

export async function shouldShowPaywall(userId: string, featureKey: string): Promise<boolean> {
  if (!userId) return false
  const memberFlag = await isMember(userId)
  if (memberFlag) return false

  const todayKey = new Date().toISOString().slice(0, 10)
  const shownKey = userKey(userId, `${PAYWALL_SHOWN_KEY}_${featureKey}_${todayKey}`)
  const shown = getStorage<boolean>(shownKey)
  return !shown
}

export async function markPaywallShown(userId: string, featureKey: string): Promise<void> {
  const todayKey = new Date().toISOString().slice(0, 10)
  const shownKey = userKey(userId, `${PAYWALL_SHOWN_KEY}_${featureKey}_${todayKey}`)
  setStorage(shownKey, true)
}

export async function checkFeatureAccess(userId: string, featureKey: string): Promise<{ allowed: boolean; remaining: number; isMember: boolean }> {
  if (!userId) throw new Error('[MembershipService] userId is required')

  try {
    const result = await api.get<{ allowed: boolean; remaining: number; isMember: boolean }>(`/quotas/check?userId=${userId}&featureKey=${featureKey}`)
    return result
  } catch {
    const memberFlag = await isMember(userId)
    if (memberFlag) {
      return { allowed: true, remaining: Infinity, isMember: true }
    }

    const limit = FREE_QUOTA_LIMITS[featureKey] ?? 0
    if (limit === 0) {
      return { allowed: false, remaining: 0, isMember: false }
    }

    const todayKey = new Date().toISOString().slice(0, 10)
    const usageKey = userKey(userId, `quota_${featureKey}_${todayKey}`)
    const usedToday = getStorage<number>(usageKey) ?? 0
    const remaining = Math.max(0, limit - usedToday)

    return { allowed: remaining > 0, remaining, isMember: false }
  }
}
