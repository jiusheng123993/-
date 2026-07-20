import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PetHealthEntry } from '../../memory-body/types/memoryBodyTypes'

const {
  mockInitUser,
  mockFetchCheckins,
  mockFetchTodayCheckin,
  mockAddCheckin,
  mockFetchStats,
  mockClearError,
} = vi.hoisted(() => ({
  mockInitUser: vi.fn(),
  mockFetchCheckins: vi.fn(),
  mockFetchTodayCheckin: vi.fn(),
  mockAddCheckin: vi.fn(),
  mockFetchStats: vi.fn(),
  mockClearError: vi.fn(),
}))

vi.mock('react', () => {
  const actual = { useCallback: (fn: any) => fn, useEffect: (fn: any) => fn() }
  return { ...actual, default: actual }
})

const defaultMockStore = {
  entries: [] as PetHealthEntry[],
  todayEntry: null as PetHealthEntry | null,
  stats: null,
  isLoading: false,
  error: null as string | null,
  initUser: mockInitUser,
  fetchCheckins: mockFetchCheckins,
  fetchTodayCheckin: mockFetchTodayCheckin,
  addCheckin: mockAddCheckin,
  fetchStats: mockFetchStats,
  clearError: mockClearError,
}

vi.mock('../../stores/checkinStore', () => ({
  useCheckinStore: vi.fn(() => ({ ...defaultMockStore }))
}))

import { useCheckinStore } from '../../stores/checkinStore'
import { useCheckin } from '../useCheckin'

function createMockEntry(overrides: Partial<PetHealthEntry> = {}): PetHealthEntry {
  return {
    id: 'entry-1',
    petId: 'pet-1',
    userId: 'user-1',
    poopLevel: 3 as const,
    appetiteLevel: 3 as const,
    spiritLevel: 3 as const,
    exerciseLevel: 2 as const,
    hasAnomaly: false,
    anomalyItems: [],
    riskLevel: 'low' as const,
    aiFeedback: '',
    createdAt: new Date('2026-07-20'),
    ...overrides,
  }
}

describe('useCheckin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCheckinStore).mockReturnValue({ ...defaultMockStore })
  })

  it('返回值包含所有预期字段', () => {
    const result = useCheckin()
    expect(result).toHaveProperty('entries')
    expect(result).toHaveProperty('todayEntry')
    expect(result).toHaveProperty('stats')
    expect(result).toHaveProperty('isLoading')
    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('initUser')
    expect(result).toHaveProperty('addCheckin')
    expect(result).toHaveProperty('fetchTodayCheckin')
    expect(result).toHaveProperty('fetchStats')
    expect(result).toHaveProperty('refreshCheckins')
    expect(result).toHaveProperty('clearError')
  })

  it('initUser 调用 store 的 initUser', () => {
    const result = useCheckin()
    result.initUser('user-123')
    expect(mockInitUser).toHaveBeenCalledWith('user-123')
  })

  it('addCheckin 调用 store 的 addCheckin 并返回结果', async () => {
    const mockEntry = createMockEntry()
    mockAddCheckin.mockResolvedValue(mockEntry)
    const result = useCheckin()
    const data: Omit<PetHealthEntry, 'id' | 'createdAt' | 'aiFeedback' | 'riskLevel'> = {
      petId: 'pet-1',
      userId: 'user-1',
      poopLevel: 3 as const,
      appetiteLevel: 3 as const,
      spiritLevel: 3 as const,
      exerciseLevel: 2 as const,
      hasAnomaly: false,
      anomalyItems: [],
    }
    const entry = await result.addCheckin(data)
    expect(mockAddCheckin).toHaveBeenCalledWith(data)
    expect(entry).toEqual(mockEntry)
  })

  it('fetchTodayCheckin 调用 store 的 fetchTodayCheckin', async () => {
    mockFetchTodayCheckin.mockResolvedValue(undefined)
    const result = useCheckin()
    await result.fetchTodayCheckin('pet-1')
    expect(mockFetchTodayCheckin).toHaveBeenCalledWith('pet-1')
  })

  it('fetchStats 调用 store 的 fetchStats', async () => {
    mockFetchStats.mockResolvedValue(undefined)
    const result = useCheckin()
    await result.fetchStats('pet-1')
    expect(mockFetchStats).toHaveBeenCalledWith('pet-1')
  })

  it('refreshCheckins 调用 store 的 fetchCheckins', async () => {
    mockFetchCheckins.mockResolvedValue(undefined)
    const result = useCheckin()
    await result.refreshCheckins('pet-1')
    expect(mockFetchCheckins).toHaveBeenCalledWith('pet-1')
  })

  it('clearError 调用 store 的 clearError', () => {
    const result = useCheckin()
    result.clearError()
    expect(mockClearError).toHaveBeenCalled()
  })

  it('返回 store 中的 entries', () => {
    const mockEntries = [createMockEntry({ id: 'e1' })]
    vi.mocked(useCheckinStore).mockReturnValue({ ...defaultMockStore, entries: mockEntries })
    const result = useCheckin()
    expect(result.entries).toEqual(mockEntries)
  })

  it('返回 store 中的 todayEntry', () => {
    const mockToday = createMockEntry({ id: 'e2' })
    vi.mocked(useCheckinStore).mockReturnValue({ ...defaultMockStore, todayEntry: mockToday })
    const result = useCheckin()
    expect(result.todayEntry).toEqual(mockToday)
  })

  it('返回 store 中的 stats', () => {
    const mockStats = { totalCheckins: 10, streak: 5, lastCheckinDate: '2026-07-20' }
    vi.mocked(useCheckinStore).mockReturnValue({ ...defaultMockStore, stats: mockStats })
    const result = useCheckin()
    expect(result.stats).toEqual(mockStats)
  })

  it('返回 store 中的 isLoading', () => {
    vi.mocked(useCheckinStore).mockReturnValue({ ...defaultMockStore, isLoading: true })
    const result = useCheckin()
    expect(result.isLoading).toBe(true)
  })

  it('返回 store 中的 error', () => {
    vi.mocked(useCheckinStore).mockReturnValue({ ...defaultMockStore, error: '加载失败' })
    const result = useCheckin()
    expect(result.error).toBe('加载失败')
  })

  it('todayEntry 为 null 时正确返回', () => {
    const result = useCheckin()
    expect(result.todayEntry).toBeNull()
  })

  it('stats 为 null 时正确返回', () => {
    const result = useCheckin()
    expect(result.stats).toBeNull()
  })

  it('error 为 null 时正确返回', () => {
    const result = useCheckin()
    expect(result.error).toBeNull()
  })
})
