import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockCheckinService, mockStorage } = vi.hoisted(() => {
  return {
    mockCheckinService: {
      getCheckins: vi.fn(),
      createCheckin: vi.fn(),
      getTodayCheckin: vi.fn(),
      getCheckinStats: vi.fn(),
    },
    mockStorage: {
      setStorageUserId: vi.fn(),
    },
  }
})

vi.mock('../../services/checkinService', () => mockCheckinService)
vi.mock('../../utils/storage', () => mockStorage)

import { useCheckinStore } from '../checkinStore'
import type { PetHealthEntry, HealthRiskLevel } from '../../memory-body/types/memoryBodyTypes'
import type { HealthCheckinStats } from '../../services/checkinService'

function makeEntry(overrides: Partial<PetHealthEntry> = {}): PetHealthEntry {
  return {
    id: 'entry_001',
    petId: 'pet_001',
    userId: 'user_001',
    poopLevel: 4,
    appetiteLevel: 4,
    spiritLevel: 4,
    exerciseLevel: 2,
    weight: 30,
    hasAnomaly: false,
    anomalyItems: [],
    aiFeedback: '✅ 您的宠物今天状态不错！继续保持良好的照顾习惯。',
    riskLevel: 'low' as HealthRiskLevel,
    note: '',
    createdAt: new Date('2024-06-01T10:00:00.000Z'),
    ...overrides,
  }
}

function makeCheckinData() {
  return {
    petId: 'pet_001',
    userId: 'user_001',
    poopLevel: 4 as const,
    appetiteLevel: 4 as const,
    spiritLevel: 4 as const,
    exerciseLevel: 2 as const,
    weight: 30,
    hasAnomaly: false,
    anomalyItems: [] as import('../../memory-body/types/memoryBodyTypes').AnomalyItem[],
    note: '',
  }
}

function makeStats(overrides: Partial<HealthCheckinStats> = {}): HealthCheckinStats {
  return {
    totalCheckins: 10,
    streak: 5,
    lastCheckinDate: '2024-06-01',
    weeklyCount: 3,
    monthlyCount: 8,
    ...overrides,
  }
}

describe('checkinStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCheckinStore.setState({
      userId: '',
      entries: [],
      todayEntry: null,
      stats: null,
      isLoading: false,
      error: null,
    })
  })

  describe('initial state', () => {
    it('should have empty userId', () => {
      const state = useCheckinStore.getState()
      expect(state.userId).toBe('')
    })

    it('should have empty entries', () => {
      const state = useCheckinStore.getState()
      expect(state.entries).toEqual([])
    })

    it('should have null todayEntry', () => {
      const state = useCheckinStore.getState()
      expect(state.todayEntry).toBeNull()
    })

    it('should have null stats', () => {
      const state = useCheckinStore.getState()
      expect(state.stats).toBeNull()
    })

    it('should have isLoading as false', () => {
      const state = useCheckinStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('should have null error', () => {
      const state = useCheckinStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('initUser', () => {
    it('should set userId and call setStorageUserId', () => {
      useCheckinStore.getState().initUser('user_123')

      const state = useCheckinStore.getState()
      expect(state.userId).toBe('user_123')
      expect(mockStorage.setStorageUserId).toHaveBeenCalledWith('user_123')
    })

    it('should throw when userId is empty string', () => {
      expect(() => useCheckinStore.getState().initUser('')).toThrow(
        '[CheckinStore] userId is required'
      )
    })
  })

  describe('fetchCheckins', () => {
    it('should throw when userId not initialized', async () => {
      await expect(
        useCheckinStore.getState().fetchCheckins('pet_001')
      ).rejects.toThrow('[CheckinStore] userId not initialized')
    })

    it('should load entries and set isLoading correctly', async () => {
      useCheckinStore.setState({ userId: 'user_001' })
      const mockEntries = [makeEntry(), makeEntry({ id: 'entry_002' })]
      mockCheckinService.getCheckins.mockResolvedValue(mockEntries)

      await useCheckinStore.getState().fetchCheckins('pet_001')

      const state = useCheckinStore.getState()
      expect(state.entries).toHaveLength(2)
      expect(state.entries[0].id).toBe('entry_001')
      expect(state.entries[1].id).toBe('entry_002')
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
      expect(mockCheckinService.getCheckins).toHaveBeenCalledWith('pet_001', 'user_001')
    })

    it('should set error when fetch fails with Error instance', async () => {
      useCheckinStore.setState({ userId: 'user_001' })
      mockCheckinService.getCheckins.mockRejectedValue(new Error('Network error'))

      await useCheckinStore.getState().fetchCheckins('pet_001')

      const state = useCheckinStore.getState()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBe('Network error')
      expect(state.entries).toEqual([])
    })

    it('should set default error message when fetch fails with non-Error', async () => {
      useCheckinStore.setState({ userId: 'user_001' })
      mockCheckinService.getCheckins.mockRejectedValue('unknown failure')

      await useCheckinStore.getState().fetchCheckins('pet_001')

      const state = useCheckinStore.getState()
      expect(state.error).toBe('获取打卡记录失败')
    })

    it('should set isLoading to true during fetch and false after', async () => {
      useCheckinStore.setState({ userId: 'user_001' })
      let resolveFetch!: (value: PetHealthEntry[]) => void
      mockCheckinService.getCheckins.mockReturnValue(
        new Promise<PetHealthEntry[]>((resolve) => {
          resolveFetch = resolve
        })
      )

      const fetchPromise = useCheckinStore.getState().fetchCheckins('pet_001')
      expect(useCheckinStore.getState().isLoading).toBe(true)

      resolveFetch([])
      await fetchPromise

      expect(useCheckinStore.getState().isLoading).toBe(false)
    })
  })

  describe('fetchTodayCheckin', () => {
    it('should throw when userId not initialized', async () => {
      await expect(
        useCheckinStore.getState().fetchTodayCheckin('pet_001')
      ).rejects.toThrow('[CheckinStore] userId not initialized')
    })

    it('should load todayEntry', async () => {
      useCheckinStore.setState({ userId: 'user_001' })
      const mockToday = makeEntry()
      mockCheckinService.getTodayCheckin.mockResolvedValue(mockToday)

      await useCheckinStore.getState().fetchTodayCheckin('pet_001')

      const state = useCheckinStore.getState()
      expect(state.todayEntry).not.toBeNull()
      expect(state.todayEntry!.id).toBe('entry_001')
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
      expect(mockCheckinService.getTodayCheckin).toHaveBeenCalledWith('pet_001', 'user_001')
    })

    it('should set todayEntry to null when no today checkin', async () => {
      useCheckinStore.setState({ userId: 'user_001' })
      mockCheckinService.getTodayCheckin.mockResolvedValue(null)

      await useCheckinStore.getState().fetchTodayCheckin('pet_001')

      const state = useCheckinStore.getState()
      expect(state.todayEntry).toBeNull()
      expect(state.isLoading).toBe(false)
    })

    it('should set error when fetch fails with Error instance', async () => {
      useCheckinStore.setState({ userId: 'user_001' })
      mockCheckinService.getTodayCheckin.mockRejectedValue(new Error('Server error'))

      await useCheckinStore.getState().fetchTodayCheckin('pet_001')

      const state = useCheckinStore.getState()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBe('Server error')
    })

    it('should set default error message when fetch fails with non-Error', async () => {
      useCheckinStore.setState({ userId: 'user_001' })
      mockCheckinService.getTodayCheckin.mockRejectedValue('fail')

      await useCheckinStore.getState().fetchTodayCheckin('pet_001')

      const state = useCheckinStore.getState()
      expect(state.error).toBe('获取今日打卡失败')
    })
  })

  describe('addCheckin', () => {
    it('should throw when userId not initialized', async () => {
      await expect(
        useCheckinStore.getState().addCheckin(makeCheckinData())
      ).rejects.toThrow('[CheckinStore] userId not initialized')
    })

    it('should add entry to list and set todayEntry', async () => {
      useCheckinStore.setState({ userId: 'user_001' })
      const newEntry = makeEntry()
      mockCheckinService.createCheckin.mockResolvedValue(newEntry)

      const result = await useCheckinStore.getState().addCheckin(makeCheckinData())

      expect(result.id).toBe('entry_001')
      const state = useCheckinStore.getState()
      expect(state.entries).toHaveLength(1)
      expect(state.entries[0].id).toBe('entry_001')
      expect(state.todayEntry).not.toBeNull()
      expect(state.todayEntry!.id).toBe('entry_001')
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should append new entry to existing entries', async () => {
      useCheckinStore.setState({
        userId: 'user_001',
        entries: [makeEntry()],
      })
      const newEntry = makeEntry({ id: 'entry_002' })
      mockCheckinService.createCheckin.mockResolvedValue(newEntry)

      await useCheckinStore.getState().addCheckin(makeCheckinData())

      const state = useCheckinStore.getState()
      expect(state.entries).toHaveLength(2)
      expect(state.entries[1].id).toBe('entry_002')
    })

    it('should pass userId to createCheckin', async () => {
      useCheckinStore.setState({ userId: 'user_001' })
      const newEntry = makeEntry()
      mockCheckinService.createCheckin.mockResolvedValue(newEntry)

      const data = makeCheckinData()
      await useCheckinStore.getState().addCheckin(data)

      expect(mockCheckinService.createCheckin).toHaveBeenCalledWith({
        ...data,
        userId: 'user_001',
      })
    })

    it('should set error and re-throw when createCheckin fails with Error', async () => {
      useCheckinStore.setState({ userId: 'user_001' })
      mockCheckinService.createCheckin.mockRejectedValue(new Error('Create failed'))

      await expect(
        useCheckinStore.getState().addCheckin(makeCheckinData())
      ).rejects.toThrow('Create failed')

      const state = useCheckinStore.getState()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBe('Create failed')
    })

    it('should set default error message and re-throw when createCheckin fails with non-Error', async () => {
      useCheckinStore.setState({ userId: 'user_001' })
      mockCheckinService.createCheckin.mockRejectedValue('unknown')

      await expect(
        useCheckinStore.getState().addCheckin(makeCheckinData())
      ).rejects.toBe('unknown')

      const state = useCheckinStore.getState()
      expect(state.error).toBe('创建打卡失败')
    })
  })

  describe('fetchStats', () => {
    it('should throw when userId not initialized', async () => {
      await expect(
        useCheckinStore.getState().fetchStats('pet_001')
      ).rejects.toThrow('[CheckinStore] userId not initialized')
    })

    it('should load stats', async () => {
      useCheckinStore.setState({ userId: 'user_001' })
      const mockStats = makeStats()
      mockCheckinService.getCheckinStats.mockResolvedValue(mockStats)

      await useCheckinStore.getState().fetchStats('pet_001')

      const state = useCheckinStore.getState()
      expect(state.stats).not.toBeNull()
      expect(state.stats!.totalCheckins).toBe(10)
      expect(state.stats!.streak).toBe(5)
      expect(state.stats!.lastCheckinDate).toBe('2024-06-01')
      expect(state.stats!.weeklyCount).toBe(3)
      expect(state.stats!.monthlyCount).toBe(8)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
      expect(mockCheckinService.getCheckinStats).toHaveBeenCalledWith('pet_001', 'user_001')
    })

    it('should set error when fetch fails with Error instance', async () => {
      useCheckinStore.setState({ userId: 'user_001' })
      mockCheckinService.getCheckinStats.mockRejectedValue(new Error('Stats error'))

      await useCheckinStore.getState().fetchStats('pet_001')

      const state = useCheckinStore.getState()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBe('Stats error')
    })

    it('should set default error message when fetch fails with non-Error', async () => {
      useCheckinStore.setState({ userId: 'user_001' })
      mockCheckinService.getCheckinStats.mockRejectedValue('fail')

      await useCheckinStore.getState().fetchStats('pet_001')

      const state = useCheckinStore.getState()
      expect(state.error).toBe('获取打卡统计失败')
    })
  })

  describe('clearError', () => {
    it('should clear error', () => {
      useCheckinStore.setState({ error: 'Some error' })

      useCheckinStore.getState().clearError()

      const state = useCheckinStore.getState()
      expect(state.error).toBeNull()
    })

    it('should not affect other state when clearing error', () => {
      useCheckinStore.setState({
        userId: 'user_001',
        entries: [makeEntry()],
        todayEntry: makeEntry(),
        stats: makeStats(),
        isLoading: true,
        error: 'Some error',
      })

      useCheckinStore.getState().clearError()

      const state = useCheckinStore.getState()
      expect(state.userId).toBe('user_001')
      expect(state.entries).toHaveLength(1)
      expect(state.todayEntry).not.toBeNull()
      expect(state.stats).not.toBeNull()
      expect(state.isLoading).toBe(true)
      expect(state.error).toBeNull()
    })
  })
})
