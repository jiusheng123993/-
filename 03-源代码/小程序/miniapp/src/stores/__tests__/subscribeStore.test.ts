import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSubscribeStore } from '../subscribeStore'
import * as subscribeService from '../../services/subscribeService'
import type { SubscribeStatus } from '../../services/subscribeService'

vi.mock('../../services/subscribeService')

describe('subscribeStore', () => {
  const mockStatusAccepted: SubscribeStatus = {
    templateId: 'FOLLOWUP_TEMPLATE_ID_PLACEHOLDER',
    accepted: true,
    acceptedAt: 1700000000000,
    usageCount: 1,
  }

  const mockStatusRejected: SubscribeStatus = {
    templateId: 'CARE_PLAN_REMINDER_TEMPLATE_ID_PLACEHOLDER',
    accepted: false,
    usageCount: 0,
  }

  const mockStatusHealth: SubscribeStatus = {
    templateId: 'HEALTH_CHECKIN_TEMPLATE_ID_PLACEHOLDER',
    accepted: true,
    acceptedAt: 1700000001000,
    usageCount: 0,
  }

  beforeEach(() => {
    useSubscribeStore.setState({
      statuses: [],
      isLoading: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('statuses 应为空数组', () => {
      const state = useSubscribeStore.getState()
      expect(state.statuses).toEqual([])
    })

    it('isLoading 应为 false', () => {
      const state = useSubscribeStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('error 应为 null', () => {
      const state = useSubscribeStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('requestAll', () => {
    it('请求所有模板订阅成功时应更新 statuses 并返回结果', async () => {
      const mockResults: Record<string, boolean> = {
        FOLLOWUP_TEMPLATE_ID_PLACEHOLDER: true,
        CARE_PLAN_REMINDER_TEMPLATE_ID_PLACEHOLDER: false,
        HEALTH_CHECKIN_TEMPLATE_ID_PLACEHOLDER: true,
      }
      vi.mocked(subscribeService.requestAllSubscribes).mockResolvedValue(mockResults)
      vi.mocked(subscribeService.getAllSubscribeStatus).mockReturnValue([
        mockStatusAccepted,
        mockStatusRejected,
        mockStatusHealth,
      ])

      const store = useSubscribeStore.getState()
      const results = await store.requestAll()

      expect(results).toEqual(mockResults)
      expect(subscribeService.requestAllSubscribes).toHaveBeenCalledOnce()
      expect(subscribeService.getAllSubscribeStatus).toHaveBeenCalledOnce()
      const state = useSubscribeStore.getState()
      expect(state.statuses).toEqual([mockStatusAccepted, mockStatusRejected, mockStatusHealth])
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('请求过程中 isLoading 应为 true', async () => {
      vi.mocked(subscribeService.requestAllSubscribes).mockImplementation(
        () => new Promise(() => {})
      )

      const store = useSubscribeStore.getState()
      store.requestAll()

      const state = useSubscribeStore.getState()
      expect(state.isLoading).toBe(true)
      expect(state.error).toBeNull()
    })

    it('请求失败时应设置 error 并返回空对象', async () => {
      vi.mocked(subscribeService.requestAllSubscribes).mockRejectedValue(
        new Error('订阅请求失败')
      )

      const store = useSubscribeStore.getState()
      const results = await store.requestAll()

      expect(results).toEqual({})
      const state = useSubscribeStore.getState()
      expect(state.error).toBe('订阅请求失败')
      expect(state.isLoading).toBe(false)
    })

    it('请求失败时非 Error 对象应使用默认错误信息', async () => {
      vi.mocked(subscribeService.requestAllSubscribes).mockRejectedValue('unknown')

      const store = useSubscribeStore.getState()
      const results = await store.requestAll()

      expect(results).toEqual({})
      const state = useSubscribeStore.getState()
      expect(state.error).toBe('订阅请求失败')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('requestFollowup', () => {
    it('请求跟进模板订阅成功时应更新 statuses 并返回 true', async () => {
      vi.mocked(subscribeService.requestFollowupSubscribe).mockResolvedValue(true)
      vi.mocked(subscribeService.getAllSubscribeStatus).mockReturnValue([mockStatusAccepted])

      const store = useSubscribeStore.getState()
      const result = await store.requestFollowup()

      expect(result).toBe(true)
      expect(subscribeService.requestFollowupSubscribe).toHaveBeenCalledOnce()
      expect(subscribeService.getAllSubscribeStatus).toHaveBeenCalledOnce()
      const state = useSubscribeStore.getState()
      expect(state.statuses).toEqual([mockStatusAccepted])
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('请求跟进模板订阅被拒绝时应返回 false', async () => {
      vi.mocked(subscribeService.requestFollowupSubscribe).mockResolvedValue(false)
      vi.mocked(subscribeService.getAllSubscribeStatus).mockReturnValue([mockStatusRejected])

      const store = useSubscribeStore.getState()
      const result = await store.requestFollowup()

      expect(result).toBe(false)
      const state = useSubscribeStore.getState()
      expect(state.statuses).toEqual([mockStatusRejected])
      expect(state.isLoading).toBe(false)
    })

    it('请求失败时应设置 error 并返回 false', async () => {
      vi.mocked(subscribeService.requestFollowupSubscribe).mockRejectedValue(
        new Error('网络异常')
      )

      const store = useSubscribeStore.getState()
      const result = await store.requestFollowup()

      expect(result).toBe(false)
      const state = useSubscribeStore.getState()
      expect(state.error).toBe('网络异常')
      expect(state.isLoading).toBe(false)
    })

    it('请求失败时非 Error 对象应使用默认错误信息', async () => {
      vi.mocked(subscribeService.requestFollowupSubscribe).mockRejectedValue(null)

      const store = useSubscribeStore.getState()
      const result = await store.requestFollowup()

      expect(result).toBe(false)
      const state = useSubscribeStore.getState()
      expect(state.error).toBe('订阅请求失败')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('requestCarePlan', () => {
    it('请求护理计划模板订阅成功时应更新 statuses 并返回 true', async () => {
      vi.mocked(subscribeService.requestCarePlanSubscribe).mockResolvedValue(true)
      vi.mocked(subscribeService.getAllSubscribeStatus).mockReturnValue([mockStatusAccepted])

      const store = useSubscribeStore.getState()
      const result = await store.requestCarePlan()

      expect(result).toBe(true)
      expect(subscribeService.requestCarePlanSubscribe).toHaveBeenCalledOnce()
      expect(subscribeService.getAllSubscribeStatus).toHaveBeenCalledOnce()
      const state = useSubscribeStore.getState()
      expect(state.statuses).toEqual([mockStatusAccepted])
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('请求护理计划模板订阅被拒绝时应返回 false', async () => {
      vi.mocked(subscribeService.requestCarePlanSubscribe).mockResolvedValue(false)
      vi.mocked(subscribeService.getAllSubscribeStatus).mockReturnValue([mockStatusRejected])

      const store = useSubscribeStore.getState()
      const result = await store.requestCarePlan()

      expect(result).toBe(false)
      const state = useSubscribeStore.getState()
      expect(state.statuses).toEqual([mockStatusRejected])
      expect(state.isLoading).toBe(false)
    })

    it('请求失败时应设置 error 并返回 false', async () => {
      vi.mocked(subscribeService.requestCarePlanSubscribe).mockRejectedValue(
        new Error('请求超时')
      )

      const store = useSubscribeStore.getState()
      const result = await store.requestCarePlan()

      expect(result).toBe(false)
      const state = useSubscribeStore.getState()
      expect(state.error).toBe('请求超时')
      expect(state.isLoading).toBe(false)
    })

    it('请求失败时非 Error 对象应使用默认错误信息', async () => {
      vi.mocked(subscribeService.requestCarePlanSubscribe).mockRejectedValue(undefined)

      const store = useSubscribeStore.getState()
      const result = await store.requestCarePlan()

      expect(result).toBe(false)
      const state = useSubscribeStore.getState()
      expect(state.error).toBe('订阅请求失败')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('isAccepted', () => {
    it('模板已接受时应返回 true', () => {
      vi.mocked(subscribeService.hasAcceptedSubscribe).mockReturnValue(true)

      const store = useSubscribeStore.getState()
      const result = store.isAccepted('FOLLOWUP_TEMPLATE_ID_PLACEHOLDER')

      expect(result).toBe(true)
      expect(subscribeService.hasAcceptedSubscribe).toHaveBeenCalledWith(
        'FOLLOWUP_TEMPLATE_ID_PLACEHOLDER'
      )
    })

    it('模板未接受时应返回 false', () => {
      vi.mocked(subscribeService.hasAcceptedSubscribe).mockReturnValue(false)

      const store = useSubscribeStore.getState()
      const result = store.isAccepted('CARE_PLAN_REMINDER_TEMPLATE_ID_PLACEHOLDER')

      expect(result).toBe(false)
      expect(subscribeService.hasAcceptedSubscribe).toHaveBeenCalledWith(
        'CARE_PLAN_REMINDER_TEMPLATE_ID_PLACEHOLDER'
      )
    })
  })

  describe('hasAnyAccepted', () => {
    it('没有任何订阅状态时应返回 false', () => {
      useSubscribeStore.setState({ statuses: [] })

      const store = useSubscribeStore.getState()
      const result = store.hasAnyAccepted()

      expect(result).toBe(false)
    })

    it('所有模板都未接受时应返回 false', () => {
      useSubscribeStore.setState({ statuses: [mockStatusRejected] })

      const store = useSubscribeStore.getState()
      const result = store.hasAnyAccepted()

      expect(result).toBe(false)
    })

    it('有至少一个模板已接受时应返回 true', () => {
      useSubscribeStore.setState({
        statuses: [mockStatusRejected, mockStatusAccepted],
      })

      const store = useSubscribeStore.getState()
      const result = store.hasAnyAccepted()

      expect(result).toBe(true)
    })

    it('所有模板都已接受时应返回 true', () => {
      useSubscribeStore.setState({
        statuses: [mockStatusAccepted, mockStatusHealth],
      })

      const store = useSubscribeStore.getState()
      const result = store.hasAnyAccepted()

      expect(result).toBe(true)
    })
  })

  describe('clearAll', () => {
    it('应调用 clearSubscribeStatus 并清空 statuses', () => {
      useSubscribeStore.setState({
        statuses: [mockStatusAccepted, mockStatusRejected, mockStatusHealth],
      })

      const store = useSubscribeStore.getState()
      store.clearAll()

      expect(subscribeService.clearSubscribeStatus).toHaveBeenCalledOnce()
      const state = useSubscribeStore.getState()
      expect(state.statuses).toEqual([])
    })

    it('空状态下调用应正常工作', () => {
      const store = useSubscribeStore.getState()
      store.clearAll()

      expect(subscribeService.clearSubscribeStatus).toHaveBeenCalledOnce()
      const state = useSubscribeStore.getState()
      expect(state.statuses).toEqual([])
    })
  })

  describe('clearError', () => {
    it('应清除 error 状态', () => {
      useSubscribeStore.setState({ error: '订阅请求失败' })

      const store = useSubscribeStore.getState()
      store.clearError()

      const state = useSubscribeStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('fetchStatuses', () => {
    it('应从 service 获取状态并更新 statuses', () => {
      vi.mocked(subscribeService.getAllSubscribeStatus).mockReturnValue([
        mockStatusAccepted,
        mockStatusHealth,
      ])

      const store = useSubscribeStore.getState()
      store.fetchStatuses()

      const state = useSubscribeStore.getState()
      expect(state.statuses).toEqual([mockStatusAccepted, mockStatusHealth])
      expect(subscribeService.getAllSubscribeStatus).toHaveBeenCalledOnce()
    })

    it('service 返回空数组时应设置空 statuses', () => {
      vi.mocked(subscribeService.getAllSubscribeStatus).mockReturnValue([])

      const store = useSubscribeStore.getState()
      store.fetchStatuses()

      const state = useSubscribeStore.getState()
      expect(state.statuses).toEqual([])
    })
  })
})
