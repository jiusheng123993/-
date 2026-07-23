import { create } from 'zustand'
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

  initUser: async (userId: string) => {
    set({ userId })
    await get().fetchMembership(userId)
  },

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

  checkAccess: async (featureKey: string) => {
    const { userId } = get()
    if (!userId) return { allowed: false, remaining: 0, isMember: false }
    return checkFeatureAccess(userId, featureKey)
  },

  shouldShowPaywallForFeature: async (featureKey: string) => {
    const { userId } = get()
    if (!userId) return false
    return shouldShowPaywall(userId, featureKey)
  },

  markPaywallShownForFeature: async (featureKey: string) => {
    const { userId } = get()
    if (!userId) return
    await markPaywallShown(userId, featureKey)
  },

  getPetLimit: async () => {
    const { userId } = get()
    if (!userId) return 2
    return getPetCountLimit(userId)
  },

  clearError: () => set({ error: null }),
}))
