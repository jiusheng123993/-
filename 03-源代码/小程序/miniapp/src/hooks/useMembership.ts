import { useEffect, useCallback } from 'react'
import { useMembershipStore } from '../stores/membershipStore'
import type { MembershipInfo, MembershipPlan, PaymentOrder } from '../services/membershipService'

interface UseMembershipReturn {
  membership: MembershipInfo | null
  orders: PaymentOrder[]
  isLoading: boolean
  error: string | null
  isMember: boolean
  initUser: (userId: string) => Promise<void>
  subscribePlan: (plan: MembershipPlan) => Promise<PaymentOrder>
  cancelSubscription: () => Promise<void>
  restorePurchaseStatus: () => Promise<void>
  refreshMembership: () => Promise<void>
  checkAccess: (featureKey: string) => Promise<{ allowed: boolean; remaining: number; isMember: boolean }>
  shouldShowPaywall: (featureKey: string) => Promise<boolean>
  markPaywallShown: (featureKey: string) => Promise<void>
  getPetLimit: () => Promise<number>
  clearError: () => void
}

export function useMembership(): UseMembershipReturn {
  const {
    userId,
    membership,
    orders,
    isLoading,
    error,
    initUser,
    fetchMembership,
    subscribePlan,
    cancelSubscription,
    restorePurchaseStatus,
    fetchOrders,
    checkAccess,
    shouldShowPaywallForFeature,
    markPaywallShownForFeature,
    getPetLimit,
    clearError,
  } = useMembershipStore()

  useEffect(() => {
    if (userId && !membership) {
      fetchMembership()
    }
  }, [userId, membership, fetchMembership])

  useEffect(() => {
    if (userId && orders.length === 0) {
      fetchOrders()
    }
  }, [userId, orders.length, fetchOrders])

  const handleInitUser = useCallback(async (uid: string) => {
    await initUser(uid)
  }, [initUser])

  const handleSubscribePlan = useCallback(async (plan: MembershipPlan): Promise<PaymentOrder> => {
    return subscribePlan(plan)
  }, [subscribePlan])

  const handleCancelSubscription = useCallback(async () => {
    await cancelSubscription()
  }, [cancelSubscription])

  const handleRestorePurchase = useCallback(async () => {
    await restorePurchaseStatus()
  }, [restorePurchaseStatus])

  const handleRefresh = useCallback(async () => {
    await fetchMembership()
  }, [fetchMembership])

  const handleCheckAccess = useCallback(async (featureKey: string) => {
    return checkAccess(featureKey)
  }, [checkAccess])

  const handleShouldShowPaywall = useCallback(async (featureKey: string) => {
    return shouldShowPaywallForFeature(featureKey)
  }, [shouldShowPaywallForFeature])

  const handleMarkPaywallShown = useCallback(async (featureKey: string) => {
    await markPaywallShownForFeature(featureKey)
  }, [markPaywallShownForFeature])

  const handleGetPetLimit = useCallback(async () => {
    return getPetLimit()
  }, [getPetLimit])

  const handleClearError = useCallback(() => {
    clearError()
  }, [clearError])

  return {
    membership,
    orders,
    isLoading,
    error,
    isMember: membership?.tier === 'member' && membership?.status === 'active',
    initUser: handleInitUser,
    subscribePlan: handleSubscribePlan,
    cancelSubscription: handleCancelSubscription,
    restorePurchaseStatus: handleRestorePurchase,
    refreshMembership: handleRefresh,
    checkAccess: handleCheckAccess,
    shouldShowPaywall: handleShouldShowPaywall,
    markPaywallShown: handleMarkPaywallShown,
    getPetLimit: handleGetPetLimit,
    clearError: handleClearError,
  }
}
