/**
 * 消息订阅状态管理
 * 管理微信订阅消息模板的授权状态和订阅请求
 */
import create from 'zustand'
import {
  requestAllSubscribes,
  requestFollowupSubscribe,
  requestCarePlanSubscribe,
  getAllSubscribeStatus,
  hasAcceptedSubscribe,
  clearSubscribeStatus,
  type SubscribeStatus,
  TEMPLATE_IDS,
} from '../services/subscribeService'

/** 订阅状态定义 */
interface SubscribeStoreState {
  statuses: SubscribeStatus[]
  isLoading: boolean
  error: string | null

  fetchStatuses: () => void
  requestAll: () => Promise<Record<string, boolean>>
  requestFollowup: () => Promise<boolean>
  requestCarePlan: () => Promise<boolean>
  isAccepted: (templateId: string) => boolean
  hasAnyAccepted: () => boolean
  clearAll: () => void
  clearError: () => void
}

export const useSubscribeStore = create<SubscribeStoreState>((set, get) => ({
  statuses: [],
  isLoading: false,
  error: null,

  /** 获取所有订阅模板的授权状态 */
  fetchStatuses: () => {
    const statuses = getAllSubscribeStatus()
    set({ statuses })
  },

  /** 请求订阅所有模板 */
  requestAll: async () => {
    set({ isLoading: true, error: null })
    try {
      const results = await requestAllSubscribes()
      const statuses = getAllSubscribeStatus()
      set({ statuses, isLoading: false })
      return results
    } catch (err) {
      const message = err instanceof Error ? err.message : '订阅请求失败'
      set({ error: message, isLoading: false })
      return {}
    }
  },

  /** 请求订阅回访提醒模板 */
  requestFollowup: async () => {
    set({ isLoading: true, error: null })
    try {
      const result = await requestFollowupSubscribe()
      const statuses = getAllSubscribeStatus()
      set({ statuses, isLoading: false })
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : '订阅请求失败'
      set({ error: message, isLoading: false })
      return false
    }
  },

  /** 请求订阅护理计划提醒模板 */
  requestCarePlan: async () => {
    set({ isLoading: true, error: null })
    try {
      const result = await requestCarePlanSubscribe()
      const statuses = getAllSubscribeStatus()
      set({ statuses, isLoading: false })
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : '订阅请求失败'
      set({ error: message, isLoading: false })
      return false
    }
  },

  /**
   * 检查指定模板是否已授权
   * @param templateId - 模板 ID
   */
  isAccepted: (templateId: string) => {
    return hasAcceptedSubscribe(templateId)
  },

  /** 检查是否有任一模板已授权 */
  hasAnyAccepted: () => {
    const { statuses } = get()
    return statuses.some((s) => s.accepted)
  },

  /** 清除所有订阅授权状态 */
  clearAll: () => {
    clearSubscribeStatus()
    set({ statuses: [] })
  },

  /** 清除错误状态 */
  clearError: () => set({ error: null }),
}))

export { TEMPLATE_IDS }
