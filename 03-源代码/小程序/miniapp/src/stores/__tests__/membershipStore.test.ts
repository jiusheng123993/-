/**
 * 会员状态管理 - 单元测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMembershipStore } from '../membershipStore'
import * as membershipService from '../../services/membershipService'
import type {
  MembershipInfo,
  MembershipPlan,
  PaymentOrder,
} from '../../services/membershipService'

vi.mock('../../services/membershipService')

const mockMembershipInfo: MembershipInfo = {
  userId: 'user123',
  tier: 'member',
  plan: 'monthly',
  status: 'active',
  expiresAt: '2025-12-31T00:00:00.000Z',
  startedAt: '2025-01-01T00:00:00.000Z',
  cancelledAt: null,
  paymentOrderId: 'order_001',
  price: 9.9,
}

const mockFreeMembershipInfo: MembershipInfo = {
  userId: 'user123',
  tier: 'free',
  plan: null,
  status: 'none',
  expiresAt: null,
  startedAt: null,
  cancelledAt: null,
  paymentOrderId: null,
  price: null,
}

const mockCancelledMembershipInfo: MembershipInfo = {
  userId: 'user123',
  tier: 'member',
  plan: 'monthly',
  status: 'cancelled',
  expiresAt: '2025-12-31T00:00:00.000Z',
  startedAt: '2025-01-01T00:00:00.000Z',
  cancelledAt: '2025-06-01T00:00:00.000Z',
  paymentOrderId: 'order_001',
  price: 9.9,
}

describe('membershipStore', () => {
  beforeEach(() => {
    useMembershipStore.setState({
      userId: null,
      membership: null,
      orders: [],
      isLoading: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('userId 应为 null', () => {
      const state = useMembershipStore.getState()
      expect(state.userId).toBeNull()
    })

    it('membership 应为 null', () => {
      const state = useMembershipStore.getState()
      expect(state.membership).toBeNull()
    })

    it('orders 应为空数组', () => {
      const state = useMembershipStore.getState()
      expect(state.orders).toEqual([])
    })

    it('isLoading 应为 false', () => {
      const state = useMembershipStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('error 应为 null', () => {
      const state = useMembershipStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('initUser', () => {
    it('应设置 userId 并调用 fetchMembership', async () => {
      vi.mocked(membershipService.getMembershipStatus).mockResolvedValue(mockMembershipInfo)

      const store = useMembershipStore.getState()
      await store.initUser('user123')

      const state = useMembershipStore.getState()
      expect(state.userId).toBe('user123')
      expect(state.membership).not.toBeNull()
      expect(state.isLoading).toBe(false)
    })
  })

  describe('fetchMembership', () => {
    it('成功获取会员状态时应更新 membership', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.getMembershipStatus).mockResolvedValue(mockMembershipInfo)

      const store = useMembershipStore.getState()
      await store.fetchMembership('user123')

      const state = useMembershipStore.getState()
      expect(state.membership).not.toBeNull()
      expect(state.isLoading).toBe(false)
      expect(membershipService.getMembershipStatus).toHaveBeenCalledWith('user123')
    })

    it('请求过程中 isLoading 应为 true', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.getMembershipStatus).mockImplementation(
        () => new Promise(() => {})
      )

      const store = useMembershipStore.getState()
      store.fetchMembership('user123')

      const state = useMembershipStore.getState()
      expect(state.isLoading).toBe(true)
    })

    it('请求失败时应设置 isLoading 为 false', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.getMembershipStatus).mockRejectedValue(
        new Error('获取会员状态失败')
      )

      const store = useMembershipStore.getState()
      await store.fetchMembership('user123')

      const state = useMembershipStore.getState()
      expect(state.isLoading).toBe(false)
    })
  })

  describe('subscribePlan', () => {
    it('支付成功时应返回 success', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.completeWechatPayment).mockResolvedValue({
        success: true,
        orderId: 'order_001',
      })
      vi.mocked(membershipService.getMembershipStatus).mockResolvedValue(mockMembershipInfo)

      const store = useMembershipStore.getState()
      const result = await store.subscribePlan('monthly')

      expect(result.success).toBe(true)
      expect(result.orderId).toBe('order_001')
      expect(membershipService.completeWechatPayment).toHaveBeenCalledWith('user123', 'monthly')
      const state = useMembershipStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('支付失败时应返回 success false 和 error', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.completeWechatPayment).mockResolvedValue({
        success: false,
        error: '支付取消',
      })

      const store = useMembershipStore.getState()
      const result = await store.subscribePlan('monthly')

      expect(result.success).toBe(false)
      expect(result.error).toBe('支付取消')
      const state = useMembershipStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('userId 为空时应返回 success false', async () => {
      const store = useMembershipStore.getState()
      const result = await store.subscribePlan('monthly')

      expect(result.success).toBe(false)
    })

    it('创建订单异常时应返回 success false 和 error', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.completeWechatPayment).mockRejectedValue(
        new Error('创建订单失败')
      )

      const store = useMembershipStore.getState()
      const result = await store.subscribePlan('monthly')

      expect(result.success).toBe(false)
      expect(result.error).toBe('创建订单失败')
      const state = useMembershipStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('创建订单异常时非 Error 对象应使用默认错误信息', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.completeWechatPayment).mockRejectedValue('unknown')

      const store = useMembershipStore.getState()
      const result = await store.subscribePlan('monthly')

      expect(result.success).toBe(false)
      expect(result.error).toBe('订阅失败')
      const state = useMembershipStore.getState()
      expect(state.isLoading).toBe(false)
    })
  })

  describe('cancelSubscription', () => {
    it('取消订阅成功时应更新 membership', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.cancelMembership).mockResolvedValue(mockCancelledMembershipInfo)
      vi.mocked(membershipService.getMembershipStatus).mockResolvedValue(mockCancelledMembershipInfo)

      const store = useMembershipStore.getState()
      await store.cancelSubscription()

      expect(membershipService.cancelMembership).toHaveBeenCalledWith('user123')
      const state = useMembershipStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('userId 为空时应直接返回', async () => {
      const store = useMembershipStore.getState()
      await store.cancelSubscription()

      expect(membershipService.cancelMembership).not.toHaveBeenCalled()
    })

    it('取消订阅失败时应设置 error', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.cancelMembership).mockRejectedValue(
        new Error('取消订阅失败')
      )

      const store = useMembershipStore.getState()
      await store.cancelSubscription()

      const state = useMembershipStore.getState()
      expect(state.error).toBe('取消订阅失败')
      expect(state.isLoading).toBe(false)
    })

    it('取消订阅失败时非 Error 对象应使用默认错误信息', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.cancelMembership).mockRejectedValue(undefined)

      const store = useMembershipStore.getState()
      try {
        await store.cancelSubscription()
      } catch {
      }

      const state = useMembershipStore.getState()
      expect(state.error).toBe('取消订阅失败')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('restorePurchaseStatus', () => {
    it('恢复购买成功时应更新 membership', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.restorePurchase).mockResolvedValue(mockMembershipInfo)
      vi.mocked(membershipService.getMembershipStatus).mockResolvedValue(mockMembershipInfo)

      const store = useMembershipStore.getState()
      await store.restorePurchaseStatus()

      expect(membershipService.restorePurchase).toHaveBeenCalledWith('user123')
      const state = useMembershipStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('userId 为空时应直接返回', async () => {
      const store = useMembershipStore.getState()
      await store.restorePurchaseStatus()

      expect(membershipService.restorePurchase).not.toHaveBeenCalled()
    })

    it('恢复购买失败时应设置 error', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.restorePurchase).mockRejectedValue(
        new Error('恢复购买失败')
      )

      const store = useMembershipStore.getState()
      await store.restorePurchaseStatus()

      const state = useMembershipStore.getState()
      expect(state.error).toBe('恢复购买失败')
      expect(state.isLoading).toBe(false)
    })

    it('恢复购买失败时非 Error 对象应使用默认错误信息', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.restorePurchase).mockRejectedValue('unknown')

      const store = useMembershipStore.getState()
      await store.restorePurchaseStatus()

      const state = useMembershipStore.getState()
      expect(state.error).toBe('恢复购买失败')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('fetchOrders', () => {
    const mockOrders: PaymentOrder[] = [
      {
        id: 'order_001',
        userId: 'user123',
        plan: 'monthly',
        amount: 9.9,
        status: 'pending',
        channel: 'wechat',
        createdAt: '2025-01-01T00:00:00.000Z',
        paidAt: null,
      },
      {
        id: 'order_002',
        userId: 'user123',
        plan: 'yearly',
        amount: 88,
        status: 'success',
        channel: 'wechat',
        createdAt: '2025-02-01T00:00:00.000Z',
        paidAt: '2025-02-01T00:01:00.000Z',
      },
    ]

    it('成功获取订单列表时应更新 orders', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.getOrders).mockResolvedValue(mockOrders)

      const store = useMembershipStore.getState()
      await store.fetchOrders()

      expect(membershipService.getOrders).toHaveBeenCalledWith('user123')
      const state = useMembershipStore.getState()
      expect(state.orders).toEqual(mockOrders)
    })

    it('userId 为空时不应发起请求', async () => {
      const store = useMembershipStore.getState()
      await store.fetchOrders()

      expect(membershipService.getOrders).not.toHaveBeenCalled()
    })

    it('获取订单失败时应静默处理', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.getOrders).mockRejectedValue(
        new Error('获取订单失败')
      )

      const store = useMembershipStore.getState()
      await store.fetchOrders()

      const state = useMembershipStore.getState()
      expect(state.orders).toEqual([])
    })
  })

  describe('checkAccess', () => {
    it('应调用 checkFeatureAccess 并返回结果', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      const mockAccessResult = { allowed: true, remaining: 5, isMember: true }
      vi.mocked(membershipService.checkFeatureAccess).mockResolvedValue(mockAccessResult)

      const store = useMembershipStore.getState()
      const result = await store.checkAccess('food_query')

      expect(result).toEqual(mockAccessResult)
      expect(membershipService.checkFeatureAccess).toHaveBeenCalledWith('user123', 'food_query')
    })

    it('userId 为空时应返回默认值', async () => {
      const store = useMembershipStore.getState()
      const result = await store.checkAccess('food_query')

      expect(result).toEqual({ allowed: false, remaining: 0, isMember: false })
    })
  })

  describe('shouldShowPaywallForFeature', () => {
    it('应调用 shouldShowPaywall 并返回结果', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.shouldShowPaywall).mockResolvedValue(true)

      const store = useMembershipStore.getState()
      const result = await store.shouldShowPaywallForFeature('symptom_check')

      expect(result).toBe(true)
      expect(membershipService.shouldShowPaywall).toHaveBeenCalledWith('user123', 'symptom_check')
    })

    it('userId 为空时应返回 false', async () => {
      const store = useMembershipStore.getState()
      const result = await store.shouldShowPaywallForFeature('symptom_check')

      expect(result).toBe(false)
      expect(membershipService.shouldShowPaywall).not.toHaveBeenCalled()
    })
  })

  describe('markPaywallShownForFeature', () => {
    it('应调用 markPaywallShown', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.markPaywallShown).mockResolvedValue(undefined)

      const store = useMembershipStore.getState()
      await store.markPaywallShownForFeature('food_query')

      expect(membershipService.markPaywallShown).toHaveBeenCalledWith('user123', 'food_query')
    })

    it('userId 为空时不应调用 markPaywallShown', async () => {
      const store = useMembershipStore.getState()
      await store.markPaywallShownForFeature('food_query')

      expect(membershipService.markPaywallShown).not.toHaveBeenCalled()
    })
  })

  describe('getPetLimit', () => {
    it('应调用 getPetCountLimit 并返回结果', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.getPetCountLimit).mockResolvedValue(5)

      const store = useMembershipStore.getState()
      const result = await store.getPetLimit()

      expect(result).toBe(5)
      expect(membershipService.getPetCountLimit).toHaveBeenCalledWith('user123')
    })

    it('userId 为空时应返回默认值 2', async () => {
      const store = useMembershipStore.getState()
      const result = await store.getPetLimit()

      expect(result).toBe(2)
      expect(membershipService.getPetCountLimit).not.toHaveBeenCalled()
    })
  })

  describe('clearError', () => {
    it('应清除 error 状态', () => {
      useMembershipStore.setState({ error: '获取会员状态失败' })

      const store = useMembershipStore.getState()
      store.clearError()

      const state = useMembershipStore.getState()
      expect(state.error).toBeNull()
    })

    it('error 为 null 时调用应正常工作', () => {
      const store = useMembershipStore.getState()
      store.clearError()

      const state = useMembershipStore.getState()
      expect(state.error).toBeNull()
    })
  })
})
