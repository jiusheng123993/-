/**
 * 会员体系 Hook
 * 提供会员订阅、功能权限校验、支付墙控制等能力
 */
import { useEffect, useCallback } from 'react'
import { useMembershipStore } from '../stores/membershipStore'
import { useAuthStore } from '../stores/authStore'
import type { Membership } from '../types'
import type { MembershipInfo, MembershipPlan, PaymentOrder } from '../services/membershipService'

interface UseMembershipReturn {
  membership: MembershipInfo | null
  orders: PaymentOrder[]
  isLoading: boolean
  error: string | null
  isMember: boolean
  initUser: (userId: string) => Promise<void>
  subscribePlan: (plan: MembershipPlan) => Promise<{ success: boolean; orderId?: string; error?: string }>
  cancelSubscription: () => Promise<void>
  restorePurchaseStatus: () => Promise<void>
  refreshMembership: () => Promise<void>
  checkAccess: (featureKey: string) => Promise<{ allowed: boolean; remaining: number; isMember: boolean }>
  shouldShowPaywall: (featureKey: string) => Promise<boolean>
  markPaywallShown: (featureKey: string) => Promise<void>
  getPetLimit: () => Promise<number>
  clearError: () => void
}

function toMembershipInfo(membership: Membership | null): MembershipInfo | null {
  if (!membership) return null
  const tier: MembershipInfo['tier'] = membership.level === 'free' ? 'free' : 'member'
  const plan: MembershipInfo['plan'] = membership.level === 'free' ? null : membership.level
  return {
    userId: membership.userId,
    tier,
    plan,
    status: membership.status as MembershipInfo['status'],
    expiresAt: membership.endDate,
    startedAt: membership.startDate,
    cancelledAt: null,
    paymentOrderId: null,
    price: null,
  }
}

/**
 * 会员体系 Hook
 * 提供会员订阅、功能权限校验、支付墙控制等能力
 */
export function useMembership(): UseMembershipReturn {
  const {
    userId,
    membership,
    orders = [],
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

  const authUserId = useAuthStore(s => s.user?.id || '')

  const membershipInfo = toMembershipInfo(membership)

  useEffect(() => {
    if (authUserId && !userId) {
      initUser(authUserId)
    }
  }, [authUserId, userId, initUser])

  useEffect(() => {
    if (userId && !membership) {
      fetchMembership(userId)
    }
  }, [userId, membership, fetchMembership])

  useEffect(() => {
    if (userId && orders && orders.length === 0 && fetchOrders) {
      fetchOrders()
    }
  }, [userId, orders, fetchOrders])

  const handleInitUser = useCallback(async (uid: string) => {
    await initUser(uid)
  }, [initUser])

  const handleSubscribePlan = useCallback(async (plan: MembershipPlan): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    return subscribePlan(plan)
  }, [subscribePlan])

  const handleCancelSubscription = useCallback(async () => {
    await cancelSubscription()
  }, [cancelSubscription])

  const handleRestorePurchase = useCallback(async () => {
    await restorePurchaseStatus()
  }, [restorePurchaseStatus])

  const handleRefresh = useCallback(async () => {
    if (userId) {
      await fetchMembership(userId)
    }
  }, [userId, fetchMembership])

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
    membership: membershipInfo,
    orders,
    isLoading,
    error,
    isMember: membership?.level !== 'free' && membership?.status === 'active',
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
