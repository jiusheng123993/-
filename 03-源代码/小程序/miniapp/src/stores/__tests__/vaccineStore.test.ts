import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useVaccineStore } from '../vaccineStore'
import * as vaccineService from '../../services/vaccineService'
import type { VaccineRecord, CreateVaccineData } from '../../services/vaccineService'

vi.mock('../../services/vaccineService')

describe('vaccineStore', () => {
  const mockRecord: VaccineRecord = {
    id: 'v1',
    petId: 'p1',
    type: 'vaccine',
    category: 'rabies',
    date: '2025-07-01',
    nextDate: '2026-07-01',
    status: 'pending',
    createdAt: '2025-07-01T00:00:00Z',
    updatedAt: '2025-07-01T00:00:00Z',
  }

  const mockRecord2: VaccineRecord = {
    id: 'v2',
    petId: 'p1',
    type: 'deworm',
    category: 'internal_deworm',
    date: '2025-06-01',
    nextDate: '2025-09-01',
    status: 'pending',
    createdAt: '2025-06-01T00:00:00Z',
    updatedAt: '2025-06-01T00:00:00Z',
  }

  beforeEach(() => {
    useVaccineStore.setState({
      records: [],
      upcomingRecords: [],
      overdueRecords: [],
      isLoading: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have empty records', () => {
      const state = useVaccineStore.getState()
      expect(state.records).toEqual([])
      expect(state.upcomingRecords).toEqual([])
      expect(state.overdueRecords).toEqual([])
    })

    it('should have isLoading as false', () => {
      const state = useVaccineStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('should have error as null', () => {
      const state = useVaccineStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('fetchRecords', () => {
    it('should fetch and set records', async () => {
      vi.mocked(vaccineService.getVaccineRecords).mockResolvedValue([mockRecord])

      const store = useVaccineStore.getState()
      await store.fetchRecords('p1')

      const state = useVaccineStore.getState()
      expect(state.records).toEqual([mockRecord])
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should handle fetch error', async () => {
      vi.mocked(vaccineService.getVaccineRecords).mockRejectedValue(new Error('网络错误'))

      const store = useVaccineStore.getState()
      await store.fetchRecords('p1')

      const state = useVaccineStore.getState()
      expect(state.records).toEqual([])
      expect(state.isLoading).toBe(false)
      expect(state.error).toBe('网络错误')
    })

    it('should set isLoading during fetch', async () => {
      vi.mocked(vaccineService.getVaccineRecords).mockImplementation(() => new Promise(() => {}))

      const store = useVaccineStore.getState()
      store.fetchRecords('p1')

      const state = useVaccineStore.getState()
      expect(state.isLoading).toBe(true)
    })
  })

  describe('addRecord', () => {
    it('should add record to state', async () => {
      vi.mocked(vaccineService.createVaccineRecord).mockResolvedValue(mockRecord)

      const store = useVaccineStore.getState()
      const createData: CreateVaccineData = {
        petId: 'p1',
        userId: 'u1',
        type: 'vaccine',
        category: 'rabies',
        date: '2025-07-01',
      }
      const result = await store.addRecord(createData)

      expect(result).toEqual(mockRecord)
      const state = useVaccineStore.getState()
      expect(state.records).toContainEqual(mockRecord)
      expect(state.isLoading).toBe(false)
    })

    it('should handle add error', async () => {
      vi.mocked(vaccineService.createVaccineRecord).mockRejectedValue(new Error('创建失败'))

      const store = useVaccineStore.getState()
      const createData: CreateVaccineData = {
        petId: 'p1',
        userId: 'u1',
        type: 'vaccine',
        category: 'rabies',
        date: '2025-07-01',
      }
      await expect(store.addRecord(createData)).rejects.toThrow('创建失败')

      const state = useVaccineStore.getState()
      expect(state.error).toBe('创建失败')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('updateRecord', () => {
    it('should update record in state', async () => {
      const updatedRecord = { ...mockRecord, category: 'DHPP' }
      vi.mocked(vaccineService.updateVaccineRecord).mockResolvedValue(updatedRecord)

      useVaccineStore.setState({ records: [mockRecord] })
      const store = useVaccineStore.getState()
      await store.updateRecord('v1', { category: 'DHPP' })

      const state = useVaccineStore.getState()
      expect(state.records[0].category).toBe('DHPP')
      expect(state.isLoading).toBe(false)
    })

    it('should update record in upcoming and overdue arrays', async () => {
      const updatedRecord = { ...mockRecord, category: 'DHPP' }
      vi.mocked(vaccineService.updateVaccineRecord).mockResolvedValue(updatedRecord)

      useVaccineStore.setState({
        records: [mockRecord],
        upcomingRecords: [mockRecord],
        overdueRecords: [mockRecord],
      })

      const store = useVaccineStore.getState()
      await store.updateRecord('v1', { category: 'DHPP' })

      const state = useVaccineStore.getState()
      expect(state.upcomingRecords[0].category).toBe('DHPP')
      expect(state.overdueRecords[0].category).toBe('DHPP')
    })

    it('should handle update error', async () => {
      vi.mocked(vaccineService.updateVaccineRecord).mockRejectedValue(new Error('更新失败'))

      useVaccineStore.setState({ records: [mockRecord] })
      const store = useVaccineStore.getState()
      await expect(store.updateRecord('v1', { category: 'test' })).rejects.toThrow('更新失败')

      const state = useVaccineStore.getState()
      expect(state.error).toBe('更新失败')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('removeRecord', () => {
    it('should remove record from state', async () => {
      vi.mocked(vaccineService.deleteVaccineRecord).mockResolvedValue(undefined)

      useVaccineStore.setState({
        records: [mockRecord],
        upcomingRecords: [mockRecord],
        overdueRecords: [mockRecord],
      })

      const store = useVaccineStore.getState()
      await store.removeRecord('v1')

      const state = useVaccineStore.getState()
      expect(state.records).toEqual([])
      expect(state.upcomingRecords).toEqual([])
      expect(state.overdueRecords).toEqual([])
      expect(state.isLoading).toBe(false)
    })

    it('should handle remove error', async () => {
      vi.mocked(vaccineService.deleteVaccineRecord).mockRejectedValue(new Error('删除失败'))

      useVaccineStore.setState({ records: [mockRecord] })
      const store = useVaccineStore.getState()
      await expect(store.removeRecord('v1')).rejects.toThrow('删除失败')

      const state = useVaccineStore.getState()
      expect(state.error).toBe('删除失败')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('markCompleted', () => {
    it('should mark record as completed and remove from upcoming/overdue', async () => {
      const completedRecord = { ...mockRecord, status: 'completed' as const }
      vi.mocked(vaccineService.markAsCompleted).mockResolvedValue(completedRecord)

      useVaccineStore.setState({
        records: [mockRecord],
        upcomingRecords: [mockRecord],
        overdueRecords: [mockRecord],
      })

      const store = useVaccineStore.getState()
      await store.markCompleted('v1')

      const state = useVaccineStore.getState()
      expect(state.records[0].status).toBe('completed')
      expect(state.upcomingRecords).toEqual([])
      expect(state.overdueRecords).toEqual([])
      expect(state.isLoading).toBe(false)
    })

    it('should handle mark completed error', async () => {
      vi.mocked(vaccineService.markAsCompleted).mockRejectedValue(new Error('标记失败'))

      useVaccineStore.setState({ records: [mockRecord] })
      const store = useVaccineStore.getState()
      await expect(store.markCompleted('v1')).rejects.toThrow('标记失败')

      const state = useVaccineStore.getState()
      expect(state.error).toBe('标记失败')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('fetchUpcoming', () => {
    it('should fetch and set upcoming records', async () => {
      vi.mocked(vaccineService.getUpcomingRecords).mockResolvedValue([mockRecord])

      const store = useVaccineStore.getState()
      await store.fetchUpcoming('p1', 30)

      const state = useVaccineStore.getState()
      expect(state.upcomingRecords).toEqual([mockRecord])
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should use default days parameter', async () => {
      vi.mocked(vaccineService.getUpcomingRecords).mockResolvedValue([])

      const store = useVaccineStore.getState()
      await store.fetchUpcoming('p1')

      expect(vaccineService.getUpcomingRecords).toHaveBeenCalledWith('p1', 30)
    })

    it('should handle fetch upcoming error', async () => {
      vi.mocked(vaccineService.getUpcomingRecords).mockRejectedValue(new Error('获取失败'))

      const store = useVaccineStore.getState()
      await store.fetchUpcoming('p1')

      const state = useVaccineStore.getState()
      expect(state.error).toBe('获取失败')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('fetchOverdue', () => {
    it('should fetch and set overdue records', async () => {
      vi.mocked(vaccineService.getOverdueRecords).mockResolvedValue([mockRecord])

      const store = useVaccineStore.getState()
      await store.fetchOverdue('p1')

      const state = useVaccineStore.getState()
      expect(state.overdueRecords).toEqual([mockRecord])
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should handle fetch overdue error', async () => {
      vi.mocked(vaccineService.getOverdueRecords).mockRejectedValue(new Error('获取失败'))

      const store = useVaccineStore.getState()
      await store.fetchOverdue('p1')

      const state = useVaccineStore.getState()
      expect(state.error).toBe('获取失败')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('getRecordsByMonth', () => {
    it('should return records for specific month', () => {
      const recordJuly = { ...mockRecord, date: '2025-07-15', nextDate: '2026-07-15' }
      const recordAugust = { ...mockRecord2, date: '2025-08-20', nextDate: '2025-11-20' }

      useVaccineStore.setState({
        records: [recordJuly, recordAugust],
      })

      const store = useVaccineStore.getState()
      const julyRecords = store.getRecordsByMonth(2025, 6)
      const augustRecords = store.getRecordsByMonth(2025, 7)

      expect(julyRecords).toHaveLength(1)
      expect(julyRecords[0].date).toBe('2025-07-15')
      expect(augustRecords).toHaveLength(1)
      expect(augustRecords[0].date).toBe('2025-08-20')
    })

    it('should return empty array when no records match', () => {
      useVaccineStore.setState({
        records: [mockRecord],
      })

      const store = useVaccineStore.getState()
      const result = store.getRecordsByMonth(2025, 8)

      expect(result).toEqual([])
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      useVaccineStore.setState({ error: 'some error' })

      const store = useVaccineStore.getState()
      store.clearError()

      const state = useVaccineStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('state transitions', () => {
    it('should handle multiple operations sequentially', async () => {
      vi.mocked(vaccineService.getVaccineRecords).mockResolvedValue([mockRecord, mockRecord2])
      vi.mocked(vaccineService.createVaccineRecord).mockResolvedValue(mockRecord)

      const store = useVaccineStore.getState()
      await store.fetchRecords('p1')
      expect(useVaccineStore.getState().records).toHaveLength(2)

      const createData: CreateVaccineData = {
        petId: 'p1',
        userId: 'u1',
        type: 'vaccine',
        category: 'rabies',
        date: '2025-09-01',
      }
      const newRecord = await store.addRecord(createData)
      expect(useVaccineStore.getState().records).toHaveLength(3)
    })

    it('should maintain error isolation between operations', async () => {
      vi.mocked(vaccineService.getVaccineRecords).mockRejectedValue(new Error('fetch error'))
      vi.mocked(vaccineService.createVaccineRecord).mockResolvedValue(mockRecord)

      const store = useVaccineStore.getState()
      await store.fetchRecords('p1')
      expect(useVaccineStore.getState().error).toBe('fetch error')

      store.clearError()
      expect(useVaccineStore.getState().error).toBeNull()

      const createData: CreateVaccineData = {
        petId: 'p1',
        userId: 'u1',
        type: 'vaccine',
        category: 'rabies',
        date: '2025-08-01',
      }
      const result = await store.addRecord(createData)
      expect(useVaccineStore.getState().error).toBeNull()
      expect(result).toEqual(mockRecord)
    })
  })
})
