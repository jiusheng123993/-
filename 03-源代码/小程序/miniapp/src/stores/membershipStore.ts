/**
 * 会员状态管理
 * 管理会员信息、订阅方案、订单记录和功能权限校验
 */
import create from 'zustand'
import { api } from '../services/api'
import type { Membership } from '../types'
import {
  getMembershipStatus,
  cancelMembership,
  restorePurchase,
  getOrders,
  shouldShowPaywall,
  markPaywallShown,
  checkFeatureAccess,
  getPetCountLimit,
  completeWechatPayment,
  type MembershipInfo,
  type MembershipPlan,
  type PaymentOrder,
} from '../services/membershipService'

/** 会员状态定义 */
interface MembershipState {
  userId: string | null
  membership: Membership | null
  orders: PaymentOrder[]
  isLoading: boolean
  error: string | null
  initUser: (userId: string) => Promise<void>
  fetchMembership: (userId: string) => Promise<void>
  fetchOrders: () => Promise<void>
  subscribePlan: (plan: MembershipPlan) => Promise<{ success: boolean; orderId?: string; error?: string }>
  cancelSubscription: () => Promise<void>
  restorePurchaseStatus: () => Promise<void>
  checkAccess: (featureKey: string) => Promise<{ allowed: boolean; remaining: number; isMember: boolean }>
  shouldShowPaywallForFeature: (featureKey: string) => Promise<boolean>
  markPaywallShownForFeature: (featureKey: string) => Promise<void>
  getPetLimit: () => Promise<number>
  clearError: () => void
}

export const useMembershipStore = create<MembershipState>((set, get) => ({
  userId: null,
  membership: null,
  orders: [],
  isLoading: false,
  error: null,

  /**
   * 初始化用户并加载会员信息
   * @param userId - 用户 ID
   */
  initUser: async (userId: string) => {
    set({ userId })
    await get().fetchMembership(userId)
  },

  /**
   * 获取会员状态
   * @param userId - 用户 ID
   */
  fetchMembership: async (userId: string) => {
    set({ isLoading: true })
    try {
      const info = await getMembershipStatus(userId)
      const membership: Membership = {
        id: '',
        userId,
        level: info.tier === 'member' ? (info.plan ?? 'monthly') : 'free',
        status: info.status === 'none' ? 'expired' : info.status,
        startDate: info.startedAt ?? '',
        endDate: info.expiresAt ?? '',
        createdAt: '',
      }
      set({ membership, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  /** 获取订单列表 */
  fetchOrders: async () => {
    const { userId } = get()
    if (!userId) return
    try {
      const orders = await getOrders(userId)
      set({ orders })
    } catch {
      // silent fail
    }
  },

  /**
   * 订阅会员方案
   * @param plan - 会员方案
   * @returns 订阅结果
   */
  subscribePlan: async (plan: MembershipPlan) => {
    const { userId } = get()
    if (!userId) return { success: false, error: '用户未登录' }
    set({ isLoading: true, error: null })
    try {
      const result = await completeWechatPayment(userId, plan)
      if (result.success) {
        await get().fetchMembership(userId)
      }
      set({ isLoading: false })
      return result
    } catch (err) {
      const error = err instanceof Error ? err.message : '订阅失败'
      set({ isLoading: false, error })
      return { success: false, error }
    }
  },

  /** 取消订阅 */
  cancelSubscription: async () => {
    const { userId } = get()
    if (!userId) return
    set({ isLoading: true, error: null })
    try {
      await cancelMembership(userId)
      await get().fetchMembership(userId)
      set({ isLoading: false })
    } catch (err) {
      const error = err instanceof Error ? err.message : '取消订阅失败'
      set({ isLoading: false, error })
    }
  },

  /** 恢复购买状态 */
  restorePurchaseStatus: async () => {
    const { userId } = get()
    if (!userId) return
    set({ isLoading: true, error: null })
    try {
      await restorePurchase(userId)
      await get().fetchMembership(userId)
      set({ isLoading: false })
    } catch (err) {
      const error = err instanceof Error ? err.message : '恢复购买失败'
      set({ isLoading: false, error })
    }
  },

  /**
   * 检查功能访问权限
   * @param featureKey - 功能标识
   */
  checkAccess: async (featureKey: string) => {
    const { userId } = get()
    if (!userId) return { allowed: false, remaining: 0, isMember: false }
    return checkFeatureAccess(userId, featureKey)
  },

  /**
   * 判断是否应显示付费墙
   * @param featureKey - 功能标识
   */
  shouldShowPaywallForFeature: async (featureKey: string) => {
    const { userId } = get()
    if (!userId) return false
    return shouldShowPaywall(userId, featureKey)
  },

  /**
   * 标记付费墙已展示
   * @param featureKey - 功能标识
   */
  markPaywallShownForFeature: async (featureKey: string) => {
    const { userId } = get()
    if (!userId) return
    await markPaywallShown(userId, featureKey)
  },

  /**
   * 获取宠物数量上限
   * @returns 宠物数量上限
   */
  getPetLimit: async () => {
    const { userId } = get()
    if (!userId) return 2
    return getPetCountLimit(userId)
  },

  /** 清除错误状态 */
  clearError: () => set({ error: null }),
}))
