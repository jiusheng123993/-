/**
 * 会员配置服务
 *
 * 会员方案定义/权益配置/配额管理
 */
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
  // 前三个月 3.3 折获客促销：价格与 PRD 一致（9.9 元/月），originalPrice 为划线原价
  { plan: 'monthly', label: '月度会员', price: 9.9, originalPrice: 29.9, discountLabel: '限时3.3折', durationDays: 30 },
  { plan: 'quarterly', label: '季度会员', price: 25.9, originalPrice: 79.9, discountLabel: '限时3.3折', durationDays: 90 },
  { plan: 'yearly', label: '年度会员', price: 88, originalPrice: 269, discountLabel: '限时3.3折', durationDays: 365 },
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
    const result = await api.get<Partial<MembershipInfo>>('/api/membership/status')
    const info: MembershipInfo = {
      ...getLocalMembership(userId),
      ...result,
      userId,
    }
    saveLocalMembership(userId, info)
    return info
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
  try {
    const result = await api.post<{
      order_id: string
      amount: number
      plan: MembershipPlan
      payment?: WechatPaymentParams
    }>('/api/payment/membership/order', { plan })

    const orderId = result.order_id
    const createdAt = new Date().toISOString()
    const mapped: CreateOrderResult = {
      orderId,
      amount: result.amount,
      channel: 'wechat',
      status: 'pending',
      createdAt,
      paymentParams: result.payment,
    }
    // 保存订单到本地
    const orders = getLocalOrders(userId)
    const order: PaymentOrder = {
      id: orderId,
      userId,
      plan,
      amount: result.amount,
      status: 'pending',
      channel: 'wechat',
      createdAt,
      paidAt: null,
    }
    orders.unshift(order)
    saveLocalOrders(userId, orders)
    return mapped
  } catch {
    // 离线模式：生成本地订单
    const planConfig = MEMBERSHIP_PLANS.find(p => p.plan === plan)
    const orderId = generateId()
    const result: CreateOrderResult = {
      orderId,
      amount: planConfig?.price || 0,
      channel: 'wechat',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    const orders = getLocalOrders(userId)
    const order: PaymentOrder = {
      id: orderId,
      userId,
      plan,
      amount: result.amount,
      status: 'pending',
      channel: 'wechat',
      createdAt: result.createdAt,
      paidAt: null,
    }
    orders.unshift(order)
    saveLocalOrders(userId, orders)
    return result
  }
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
      complete: () => {
        // 支付完成后的清理工作
      },
    })
  })
}

/**
 * 完整的微信支付流程
 * 1. 创建订单 → 2. 发起支付 → 3. 轮询结果 → 4. 确认支付
 */
export async function completeWechatPayment(
  userId: string,
  plan: MembershipPlan
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    // 1. 创建订单
    const order = await createPaymentOrder(userId, plan)

    if (!order.paymentParams) {
      return { success: false, error: '获取支付参数失败' }
    }

    // 2. 发起微信支付
    const paid = await requestWechatPayment(order.paymentParams)

    if (!paid) {
      return { success: false, error: '用户取消支付' }
    }

    // 3. 轮询订单状态
    const paymentStatus = await pollOrderStatus(order.orderId)

    if (paymentStatus === 'success' || paymentStatus === 'paid') {
      // 4. 确认支付
      await confirmPayment(userId, order.orderId)
      return { success: true, orderId: order.orderId }
    }

    return { success: false, error: `支付状态异常: ${paymentStatus}` }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '支付流程异常' }
  }
}

export async function pollOrderStatus(orderId: string, maxAttempts: number = 10, interval: number = 2000): Promise<PaymentStatus> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const order = await api.get<{ status: PaymentStatus }>(`/api/payment/orders/${orderId}`)
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
  // 微信回调已在服务端激活会员，此处同步本地订单状态并刷新会员缓存
  const orders = getLocalOrders(userId)
  const index = orders.findIndex((o) => o.id === orderId)
  if (index !== -1) {
    orders[index] = { ...orders[index], status: 'paid', paidAt: new Date().toISOString() }
    saveLocalOrders(userId, orders)
  }
  return getMembershipStatus(userId)
}

export async function cancelMembership(userId: string): Promise<MembershipInfo> {
  if (!userId) throw new Error('[MembershipService] userId is required')

  try {
    const result = await api.post<{ message: string; expiresAt?: string | null }>('/api/membership/cancel', {})
    const info = getLocalMembership(userId)
    const updated: MembershipInfo = {
      ...info,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      expiresAt: result.expiresAt ?? info.expiresAt,
    }
    saveLocalMembership(userId, updated)
    return updated
  } catch {
    const info = getLocalMembership(userId)
    if (info.tier !== 'member') throw new Error('[MembershipService] Not a member')

    const updated: MembershipInfo = {
      ...info,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    }
    saveLocalMembership(userId, updated)
    return updated
  }
}

export async function restorePurchase(userId: string): Promise<MembershipInfo> {
  if (!userId) throw new Error('[MembershipService] userId is required')
  // 后端无独立恢复端点：恢复购买 = 重新查询云端会员状态并刷新本地缓存
  return getMembershipStatus(userId)
}

export async function getOrders(userId: string): Promise<PaymentOrder[]> {
  if (!userId) throw new Error('[MembershipService] userId is required')
  // 后端无订单列表端点，返回本地订单
  return getLocalOrders(userId)
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

  // 后端无通用配额检查端点（仅 /api/membership/usage 覆盖部分功能），本地计算配额
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
