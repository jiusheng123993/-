import { create } from 'zustand'
import {
  getMembershipStatus,
  createPaymentOrder,
  requestWechatPayment,
  pollOrderStatus,
  confirmPayment,
  cancelMembership,
  restorePurchase,
  getOrders,
  checkFeatureAccess,
  shouldShowPaywall,
  markPaywallShown,
  getPetCountLimit,
} from '../services/membershipService'
import type {
  MembershipInfo,
  MembershipPlan,
  PaymentOrder,
  PaymentStatus,
} from '../services/membershipService'
import { setStorageUserId } from '../utils/storage'

interface MembershipStoreState {
  userId: string
  membership: MembershipInfo | null
  orders: PaymentOrder[]
  isLoading: boolean
  error: string | null

  initUser: (userId: string) => Promise<void>
  fetchMembership: () => Promise<void>
  subscribePlan: (plan: MembershipPlan) => Promise<PaymentOrder>
  completePayment: (orderId: string) => Promise<void>
  cancelSubscription: () => Promise<void>
  restorePurchaseStatus: () => Promise<void>
  fetchOrders: () => Promise<void>
  checkAccess: (featureKey: string) => Promise<{ allowed: boolean; remaining: number; isMember: boolean }>
  shouldShowPaywallForFeature: (featureKey: string) => Promise<boolean>
  markPaywallShownForFeature: (featureKey: string) => Promise<void>
  getPetLimit: () => Promise<number>
  clearError: () => void
}

export const useMembershipStore = create<MembershipStoreState>((set, get) => ({
  userId: '',
  membership: null,
  orders: [],
  isLoading: false,
  error: null,

  initUser: async (userId: string) => {
    if (!userId) throw new Error('[MembershipStore] userId is required')
    setStorageUserId(userId)
    set({ userId })
    await get().fetchMembership()
  },

  fetchMembership: async () => {
    const { userId } = get()
    if (!userId) return
    set({ isLoading: true, error: null })
    try {
      const membership = await getMembershipStatus(userId)
      set({ membership, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch membership',
      })
    }
  },

  subscribePlan: async (plan: MembershipPlan) => {
    const { userId } = get()
    if (!userId) throw new Error('[MembershipStore] userId is required')
    set({ isLoading: true, error: null })
    try {
      const orderResult = await createPaymentOrder(userId, plan)

      const paymentOrder: PaymentOrder = {
        id: orderResult.orderId,
        userId,
        plan,
        amount: orderResult.amount,
        status: 'pending' as PaymentStatus,
        channel: 'wechat',
        createdAt: orderResult.createdAt,
        paidAt: null,
      }

      if (orderResult.paymentParams) {
        const paid = await requestWechatPayment(orderResult.paymentParams)
        if (paid) {
          const finalStatus = await pollOrderStatus(orderResult.orderId)
          if (finalStatus === 'success' || finalStatus === 'paid') {
            const membership = await confirmPayment(userId, orderResult.orderId)
            set({ membership, isLoading: false })
            return paymentOrder
          }
        }
        set({ isLoading: false })
        return { ...paymentOrder, status: 'pending' as PaymentStatus }
      }

      return paymentOrder
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to subscribe',
      })
      throw err
    }
  },

  completePayment: async (orderId: string) => {
    const { userId } = get()
    if (!userId) throw new Error('[MembershipStore] userId is required')
    set({ isLoading: true, error: null })
    try {
      const membership = await confirmPayment(userId, orderId)
      set({ membership, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Payment failed',
      })
      throw err
    }
  },

  cancelSubscription: async () => {
    const { userId } = get()
    if (!userId) throw new Error('[MembershipStore] userId is required')
    set({ isLoading: true, error: null })
    try {
      const membership = await cancelMembership(userId)
      set({ membership, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to cancel',
      })
      throw err
    }
  },

  restorePurchaseStatus: async () => {
    const { userId } = get()
    if (!userId) throw new Error('[MembershipStore] userId is required')
    set({ isLoading: true, error: null })
    try {
      const membership = await restorePurchase(userId)
      set({ membership, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to restore',
      })
    }
  },

  fetchOrders: async () => {
    const { userId } = get()
    if (!userId) return
    set({ isLoading: true, error: null })
    try {
      const orders = await getOrders(userId)
      set({ orders, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch orders',
      })
    }
  },

  checkAccess: async (featureKey: string) => {
    const { userId } = get()
    if (!userId) throw new Error('[MembershipStore] userId is required')
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

  clearError: () => {
    set({ error: null })
  },
}))
