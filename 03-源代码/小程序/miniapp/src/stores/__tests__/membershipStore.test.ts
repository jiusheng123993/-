import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMembershipStore } from '../membershipStore'
import * as membershipService from '../../services/membershipService'
import * as storageUtils from '../../utils/storage'
import type {
  MembershipInfo,
  MembershipPlan,
  PaymentOrder,
  PaymentStatus,
} from '../../services/membershipService'

vi.mock('../../services/membershipService')
vi.mock('../../utils/storage')

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

const mockPaymentOrder: PaymentOrder = {
  id: 'order_001',
  userId: 'user123',
  plan: 'monthly',
  amount: 9.9,
  status: 'pending',
  channel: 'wechat',
  createdAt: '2025-01-01T00:00:00.000Z',
  paidAt: null,
}

const mockCreateOrderResult = {
  orderId: 'order_001',
  amount: 9.9,
  channel: 'wechat',
  status: 'pending',
  createdAt: '2025-01-01T00:00:00.000Z',
  paymentParams: {
    appId: 'wx123',
    timeStamp: '1700000000',
    nonceStr: 'abc123',
    package: 'prepay_id=xxx',
    signType: 'RSA',
    paySign: 'sign123',
  },
}

const mockCreateOrderResultNoPaymentParams = {
  orderId: 'order_002',
  amount: 25.9,
  channel: 'wechat',
  status: 'pending',
  createdAt: '2025-01-01T00:00:00.000Z',
}

describe('membershipStore', () => {
  beforeEach(() => {
    useMembershipStore.setState({
      userId: '',
      membership: null,
      orders: [],
      isLoading: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('userId 应为空字符串', () => {
      const state = useMembershipStore.getState()
      expect(state.userId).toBe('')
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
    it('应设置 userId 并调用 setStorageUserId 和 fetchMembership', async () => {
      vi.mocked(membershipService.getMembershipStatus).mockResolvedValue(mockMembershipInfo)

      const store = useMembershipStore.getState()
      await store.initUser('user123')

      expect(storageUtils.setStorageUserId).toHaveBeenCalledWith('user123')
      const state = useMembershipStore.getState()
      expect(state.userId).toBe('user123')
      expect(state.membership).toEqual(mockMembershipInfo)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('userId 为空时应抛出错误', async () => {
      const store = useMembershipStore.getState()
      await expect(store.initUser('')).rejects.toThrow('[MembershipStore] userId is required')
    })

    it('fetchMembership 失败时应设置 error', async () => {
      vi.mocked(membershipService.getMembershipStatus).mockRejectedValue(
        new Error('网络异常')
      )

      const store = useMembershipStore.getState()
      await store.initUser('user123')

      const state = useMembershipStore.getState()
      expect(state.userId).toBe('user123')
      expect(state.error).toBe('网络异常')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('fetchMembership', () => {
    it('成功获取会员状态时应更新 membership', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.getMembershipStatus).mockResolvedValue(mockMembershipInfo)

      const store = useMembershipStore.getState()
      await store.fetchMembership()

      const state = useMembershipStore.getState()
      expect(state.membership).toEqual(mockMembershipInfo)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
      expect(membershipService.getMembershipStatus).toHaveBeenCalledWith('user123')
    })

    it('请求过程中 isLoading 应为 true', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.getMembershipStatus).mockImplementation(
        () => new Promise(() => {})
      )

      const store = useMembershipStore.getState()
      store.fetchMembership()

      const state = useMembershipStore.getState()
      expect(state.isLoading).toBe(true)
      expect(state.error).toBeNull()
    })

    it('userId 为空时不应发起请求', async () => {
      const store = useMembershipStore.getState()
      await store.fetchMembership()

      expect(membershipService.getMembershipStatus).not.toHaveBeenCalled()
    })

    it('请求失败时应设置 error', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.getMembershipStatus).mockRejectedValue(
        new Error('获取会员状态失败')
      )

      const store = useMembershipStore.getState()
      await store.fetchMembership()

      const state = useMembershipStore.getState()
      expect(state.error).toBe('获取会员状态失败')
      expect(state.isLoading).toBe(false)
      expect(state.membership).toBeNull()
    })

    it('请求失败时非 Error 对象应使用默认错误信息', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.getMembershipStatus).mockRejectedValue('unknown')

      const store = useMembershipStore.getState()
      await store.fetchMembership()

      const state = useMembershipStore.getState()
      expect(state.error).toBe('Failed to fetch membership')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('subscribePlan', () => {
    it('支付成功时应更新 membership 并返回 PaymentOrder', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.createPaymentOrder).mockResolvedValue(mockCreateOrderResult)
      vi.mocked(membershipService.requestWechatPayment).mockResolvedValue(true)
      vi.mocked(membershipService.pollOrderStatus).mockResolvedValue('success')
      vi.mocked(membershipService.confirmPayment).mockResolvedValue(mockMembershipInfo)

      const store = useMembershipStore.getState()
      const result = await store.subscribePlan('monthly')

      expect(result.id).toBe('order_001')
      expect(result.userId).toBe('user123')
      expect(result.plan).toBe('monthly')
      expect(result.amount).toBe(9.9)
      expect(result.status).toBe('pending')
      expect(result.channel).toBe('wechat')
      expect(membershipService.createPaymentOrder).toHaveBeenCalledWith('user123', 'monthly')
      expect(membershipService.requestWechatPayment).toHaveBeenCalledWith(mockCreateOrderResult.paymentParams)
      expect(membershipService.pollOrderStatus).toHaveBeenCalledWith('order_001')
      expect(membershipService.confirmPayment).toHaveBeenCalledWith('user123', 'order_001')
      const state = useMembershipStore.getState()
      expect(state.membership).toEqual(mockMembershipInfo)
      expect(state.isLoading).toBe(false)
    })

    it('pollOrderStatus 返回 paid 时也应确认支付成功', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.createPaymentOrder).mockResolvedValue(mockCreateOrderResult)
      vi.mocked(membershipService.requestWechatPayment).mockResolvedValue(true)
      vi.mocked(membershipService.pollOrderStatus).mockResolvedValue('paid')
      vi.mocked(membershipService.confirmPayment).mockResolvedValue(mockMembershipInfo)

      const store = useMembershipStore.getState()
      const result = await store.subscribePlan('monthly')

      expect(membershipService.confirmPayment).toHaveBeenCalledWith('user123', 'order_001')
      const state = useMembershipStore.getState()
      expect(state.membership).toEqual(mockMembershipInfo)
      expect(state.isLoading).toBe(false)
    })

    it('微信支付取消时应返回 pending 状态的 PaymentOrder', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.createPaymentOrder).mockResolvedValue(mockCreateOrderResult)
      vi.mocked(membershipService.requestWechatPayment).mockResolvedValue(false)

      const store = useMembershipStore.getState()
      const result = await store.subscribePlan('monthly')

      expect(result.status).toBe('pending')
      expect(membershipService.pollOrderStatus).not.toHaveBeenCalled()
      expect(membershipService.confirmPayment).not.toHaveBeenCalled()
      const state = useMembershipStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('pollOrderStatus 返回非成功状态时应返回 pending 状态的 PaymentOrder', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.createPaymentOrder).mockResolvedValue(mockCreateOrderResult)
      vi.mocked(membershipService.requestWechatPayment).mockResolvedValue(true)
      vi.mocked(membershipService.pollOrderStatus).mockResolvedValue('pending')

      const store = useMembershipStore.getState()
      const result = await store.subscribePlan('monthly')

      expect(result.status).toBe('pending')
      expect(membershipService.confirmPayment).not.toHaveBeenCalled()
      const state = useMembershipStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('没有 paymentParams 时应直接返回 PaymentOrder', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.createPaymentOrder).mockResolvedValue(mockCreateOrderResultNoPaymentParams)

      const store = useMembershipStore.getState()
      const result = await store.subscribePlan('quarterly')

      expect(result.id).toBe('order_002')
      expect(result.amount).toBe(25.9)
      expect(membershipService.requestWechatPayment).not.toHaveBeenCalled()
    })

    it('userId 为空时应抛出错误', async () => {
      const store = useMembershipStore.getState()
      await expect(store.subscribePlan('monthly')).rejects.toThrow(
        '[MembershipStore] userId is required'
      )
    })

    it('创建订单失败时应设置 error 并抛出异常', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.createPaymentOrder).mockRejectedValue(
        new Error('创建订单失败')
      )

      const store = useMembershipStore.getState()
      await expect(store.subscribePlan('monthly')).rejects.toThrow('创建订单失败')

      const state = useMembershipStore.getState()
      expect(state.error).toBe('创建订单失败')
      expect(state.isLoading).toBe(false)
    })

    it('创建订单失败时非 Error 对象应使用默认错误信息', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.createPaymentOrder).mockRejectedValue('unknown')

      const store = useMembershipStore.getState()
      await expect(store.subscribePlan('monthly')).rejects.toBe('unknown')

      const state = useMembershipStore.getState()
      expect(state.error).toBe('Failed to subscribe')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('completePayment', () => {
    it('确认支付成功时应更新 membership', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.confirmPayment).mockResolvedValue(mockMembershipInfo)

      const store = useMembershipStore.getState()
      await store.completePayment('order_001')

      expect(membershipService.confirmPayment).toHaveBeenCalledWith('user123', 'order_001')
      const state = useMembershipStore.getState()
      expect(state.membership).toEqual(mockMembershipInfo)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('userId 为空时应抛出错误', async () => {
      const store = useMembershipStore.getState()
      await expect(store.completePayment('order_001')).rejects.toThrow(
        '[MembershipStore] userId is required'
      )
    })

    it('确认支付失败时应设置 error 并抛出异常', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.confirmPayment).mockRejectedValue(
        new Error('支付确认失败')
      )

      const store = useMembershipStore.getState()
      await expect(store.completePayment('order_001')).rejects.toThrow('支付确认失败')

      const state = useMembershipStore.getState()
      expect(state.error).toBe('支付确认失败')
      expect(state.isLoading).toBe(false)
    })

    it('确认支付失败时非 Error 对象应使用默认错误信息', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.confirmPayment).mockRejectedValue(null)

      const store = useMembershipStore.getState()
      await expect(store.completePayment('order_001')).rejects.toBe(null)

      const state = useMembershipStore.getState()
      expect(state.error).toBe('Payment failed')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('cancelSubscription', () => {
    it('取消订阅成功时应更新 membership', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.cancelMembership).mockResolvedValue(mockCancelledMembershipInfo)

      const store = useMembershipStore.getState()
      await store.cancelSubscription()

      expect(membershipService.cancelMembership).toHaveBeenCalledWith('user123')
      const state = useMembershipStore.getState()
      expect(state.membership).toEqual(mockCancelledMembershipInfo)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('userId 为空时应抛出错误', async () => {
      const store = useMembershipStore.getState()
      await expect(store.cancelSubscription()).rejects.toThrow(
        '[MembershipStore] userId is required'
      )
    })

    it('取消订阅失败时应设置 error 并抛出异常', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.cancelMembership).mockRejectedValue(
        new Error('取消订阅失败')
      )

      const store = useMembershipStore.getState()
      await expect(store.cancelSubscription()).rejects.toThrow('取消订阅失败')

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
        // expected
      }

      const state = useMembershipStore.getState()
      expect(state.error).toBe('Failed to cancel')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('restorePurchaseStatus', () => {
    it('恢复购买成功时应更新 membership', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.restorePurchase).mockResolvedValue(mockMembershipInfo)

      const store = useMembershipStore.getState()
      await store.restorePurchaseStatus()

      expect(membershipService.restorePurchase).toHaveBeenCalledWith('user123')
      const state = useMembershipStore.getState()
      expect(state.membership).toEqual(mockMembershipInfo)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('userId 为空时应抛出错误', async () => {
      const store = useMembershipStore.getState()
      await expect(store.restorePurchaseStatus()).rejects.toThrow(
        '[MembershipStore] userId is required'
      )
    })

    it('恢复购买失败时应设置 error 但不抛出异常', async () => {
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
      expect(state.error).toBe('Failed to restore')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('fetchOrders', () => {
    const mockOrders: PaymentOrder[] = [
      mockPaymentOrder,
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
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('userId 为空时不应发起请求', async () => {
      const store = useMembershipStore.getState()
      await store.fetchOrders()

      expect(membershipService.getOrders).not.toHaveBeenCalled()
    })

    it('获取订单失败时应设置 error', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.getOrders).mockRejectedValue(
        new Error('获取订单失败')
      )

      const store = useMembershipStore.getState()
      await store.fetchOrders()

      const state = useMembershipStore.getState()
      expect(state.error).toBe('获取订单失败')
      expect(state.isLoading).toBe(false)
    })

    it('获取订单失败时非 Error 对象应使用默认错误信息', async () => {
      useMembershipStore.setState({ userId: 'user123' })
      vi.mocked(membershipService.getOrders).mockRejectedValue(42)

      const store = useMembershipStore.getState()
      await store.fetchOrders()

      const state = useMembershipStore.getState()
      expect(state.error).toBe('Failed to fetch orders')
      expect(state.isLoading).toBe(false)
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

    it('userId 为空时应抛出错误', async () => {
      const store = useMembershipStore.getState()
      await expect(store.checkAccess('food_query')).rejects.toThrow(
        '[MembershipStore] userId is required'
      )
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
