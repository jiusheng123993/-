import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useReminderStore } from '../reminderStore'
import * as reminderService from '../../services/reminderService'
import type { ReminderItem } from '../../services/reminderService'

vi.mock('../../services/reminderService')

describe('reminderStore', () => {
  const mockReminderItem: ReminderItem = {
    record: {
      id: 'rec_001',
      petId: 'pet-001',
      type: 'vaccine',
      category: 'rabies',
      date: '2025-07-01',
      nextDate: '2025-07-18',
      status: 'pending',
      createdAt: '2025-07-01T00:00:00Z',
      updatedAt: '2025-07-01T00:00:00Z',
    },
    daysUntilDue: 3,
    isOverdue: false,
  }

  const mockOverdueItem: ReminderItem = {
    record: {
      id: 'rec_002',
      petId: 'pet-001',
      type: 'deworm',
      category: 'internal_deworm',
      date: '2025-01-01',
      nextDate: '2025-04-01',
      status: 'overdue',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    daysUntilDue: -5,
    isOverdue: true,
  }

  beforeEach(() => {
    useReminderStore.setState({
      subscriptionStatus: false,
      upcomingReminders: [],
      overdueReminders: [],
      isLoading: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have subscriptionStatus as false', () => {
      const state = useReminderStore.getState()
      expect(state.subscriptionStatus).toBe(false)
    })

    it('should have empty upcomingReminders', () => {
      const state = useReminderStore.getState()
      expect(state.upcomingReminders).toEqual([])
    })

    it('should have empty overdueReminders', () => {
      const state = useReminderStore.getState()
      expect(state.overdueReminders).toEqual([])
    })

    it('should have isLoading as false', () => {
      const state = useReminderStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('should have error as null', () => {
      const state = useReminderStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('fetchSubscriptionStatus', () => {
    it('should set subscriptionStatus from service', () => {
      vi.mocked(reminderService.getSubscriptionStatus).mockReturnValue(true)

      const store = useReminderStore.getState()
      store.fetchSubscriptionStatus()

      const state = useReminderStore.getState()
      expect(state.subscriptionStatus).toBe(true)
      expect(reminderService.getSubscriptionStatus).toHaveBeenCalled()
    })

    it('should set subscriptionStatus to false when not subscribed', () => {
      vi.mocked(reminderService.getSubscriptionStatus).mockReturnValue(false)

      const store = useReminderStore.getState()
      store.fetchSubscriptionStatus()

      const state = useReminderStore.getState()
      expect(state.subscriptionStatus).toBe(false)
    })
  })

  describe('requestSubscription', () => {
    it('should update subscriptionStatus to true when accepted', async () => {
      vi.mocked(reminderService.requestSubscribeMessage).mockResolvedValue(true)

      const store = useReminderStore.getState()
      const result = await store.requestSubscription()

      expect(result).toBe(true)
      const state = useReminderStore.getState()
      expect(state.subscriptionStatus).toBe(true)
      expect(state.isLoading).toBe(false)
    })

    it('should update subscriptionStatus to false when rejected', async () => {
      vi.mocked(reminderService.requestSubscribeMessage).mockResolvedValue(false)

      const store = useReminderStore.getState()
      const result = await store.requestSubscription()

      expect(result).toBe(false)
      const state = useReminderStore.getState()
      expect(state.subscriptionStatus).toBe(false)
      expect(state.isLoading).toBe(false)
    })

    it('should handle error and return false', async () => {
      vi.mocked(reminderService.requestSubscribeMessage).mockRejectedValue(new Error('订阅失败'))

      const store = useReminderStore.getState()
      const result = await store.requestSubscription()

      expect(result).toBe(false)
      const state = useReminderStore.getState()
      expect(state.error).toBe('订阅失败')
      expect(state.isLoading).toBe(false)
    })

    it('should set isLoading during request', async () => {
      vi.mocked(reminderService.requestSubscribeMessage).mockImplementation(
        () => new Promise(() => {})
      )

      const store = useReminderStore.getState()
      store.requestSubscription()

      const state = useReminderStore.getState()
      expect(state.isLoading).toBe(true)
    })
  })

  describe('fetchUpcomingReminders', () => {
    it('should fetch and set upcoming reminders', () => {
      vi.mocked(reminderService.getUpcomingReminders).mockReturnValue([mockReminderItem])

      const store = useReminderStore.getState()
      store.fetchUpcomingReminders('pet-001', 7)

      const state = useReminderStore.getState()
      expect(state.upcomingReminders).toEqual([mockReminderItem])
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should use default days parameter', () => {
      vi.mocked(reminderService.getUpcomingReminders).mockReturnValue([])

      const store = useReminderStore.getState()
      store.fetchUpcomingReminders('pet-001')

      expect(reminderService.getUpcomingReminders).toHaveBeenCalledWith('pet-001', 7)
    })

    it('should handle fetch error', () => {
      vi.mocked(reminderService.getUpcomingReminders).mockImplementation(() => {
        throw new Error('获取失败')
      })

      const store = useReminderStore.getState()
      store.fetchUpcomingReminders('pet-001')

      const state = useReminderStore.getState()
      expect(state.error).toBe('获取失败')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('fetchOverdueReminders', () => {
    it('should fetch and set overdue reminders', () => {
      vi.mocked(reminderService.getOverdueReminders).mockReturnValue([mockOverdueItem])

      const store = useReminderStore.getState()
      store.fetchOverdueReminders('pet-001')

      const state = useReminderStore.getState()
      expect(state.overdueReminders).toEqual([mockOverdueItem])
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should handle fetch error', () => {
      vi.mocked(reminderService.getOverdueReminders).mockImplementation(() => {
        throw new Error('获取逾期失败')
      })

      const store = useReminderStore.getState()
      store.fetchOverdueReminders('pet-001')

      const state = useReminderStore.getState()
      expect(state.error).toBe('获取逾期失败')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('toggleSubscription', () => {
    it('should update subscriptionStatus to true', () => {
      const store = useReminderStore.getState()
      store.toggleSubscription(true)

      const state = useReminderStore.getState()
      expect(state.subscriptionStatus).toBe(true)
      expect(reminderService.saveSubscriptionStatus).toHaveBeenCalledWith(true)
    })

    it('should update subscriptionStatus to false', () => {
      useReminderStore.setState({ subscriptionStatus: true })

      const store = useReminderStore.getState()
      store.toggleSubscription(false)

      const state = useReminderStore.getState()
      expect(state.subscriptionStatus).toBe(false)
      expect(reminderService.saveSubscriptionStatus).toHaveBeenCalledWith(false)
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      useReminderStore.setState({ error: 'some error' })

      const store = useReminderStore.getState()
      store.clearError()

      const state = useReminderStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('state transitions', () => {
    it('should handle fetch subscription then request subscription', () => {
      vi.mocked(reminderService.getSubscriptionStatus).mockReturnValue(false)

      const store = useReminderStore.getState()
      store.fetchSubscriptionStatus()
      expect(useReminderStore.getState().subscriptionStatus).toBe(false)

      vi.mocked(reminderService.requestSubscribeMessage).mockResolvedValue(true)
    })

    it('should maintain error isolation between operations', () => {
      vi.mocked(reminderService.getOverdueReminders).mockImplementation(() => {
        throw new Error('fetch error')
      })

      const store = useReminderStore.getState()
      store.fetchOverdueReminders('pet-001')
      expect(useReminderStore.getState().error).toBe('fetch error')

      store.clearError()
      expect(useReminderStore.getState().error).toBeNull()

      vi.mocked(reminderService.getUpcomingReminders).mockReturnValue([mockReminderItem])
      store.fetchUpcomingReminders('pet-001')
      expect(useReminderStore.getState().error).toBeNull()
      expect(useReminderStore.getState().upcomingReminders).toEqual([mockReminderItem])
    })
  })
})
