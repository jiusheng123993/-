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

  fetchStatuses: () => {
    const statuses = getAllSubscribeStatus()
    set({ statuses })
  },

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

  isAccepted: (templateId: string) => {
    return hasAcceptedSubscribe(templateId)
  },

  hasAnyAccepted: () => {
    const { statuses } = get()
    return statuses.some((s) => s.accepted)
  },

  clearAll: () => {
    clearSubscribeStatus()
    set({ statuses: [] })
  },

  clearError: () => set({ error: null }),
}))

export { TEMPLATE_IDS }
