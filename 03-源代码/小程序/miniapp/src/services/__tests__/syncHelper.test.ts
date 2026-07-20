import { describe, it, expect, vi, beforeEach } from 'vitest'
import { queueSync, trySyncAll, trySyncTable } from '../syncHelper'
import { getSyncService } from '../syncService'

const mockQueueForSync = vi.fn()
const mockSyncAll = vi.fn(() => Promise.resolve({ success: true, pushed: 0, pulled: 0, errors: [] }))
const mockPushTable = vi.fn(() => Promise.resolve({ pushed: 0, error: null }))
const mockPullTable = vi.fn(() => Promise.resolve({ pulled: 0, error: null }))
const mockGetAllStatuses = vi.fn(() => [])

vi.mock('../syncService', () => ({
  getSyncService: vi.fn(() => ({
    queueForSync: mockQueueForSync,
    syncAll: mockSyncAll,
    pushTable: mockPushTable,
    pullTable: mockPullTable,
    getAllStatuses: mockGetAllStatuses,
  })),
}))

describe('syncHelper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('queueSync', () => {
    it('calls getSyncService with userId', () => {
      queueSync('pet_profiles', 'rec-1', 'insert', { name: 'Mimi' }, 'user-123')
      expect(getSyncService).toHaveBeenCalledWith('user-123')
    })

    it('calls queueForSync with correct params', () => {
      queueSync('pet_profiles', 'rec-1', 'update', { name: 'Mimi' }, 'user-123')
      expect(mockQueueForSync).toHaveBeenCalledWith('pet_profiles', 'rec-1', 'update', { name: 'Mimi' })
    })

    it('silently catches error from getSyncService', () => {
      vi.mocked(getSyncService).mockImplementationOnce(() => {
        throw new Error('service init failed')
      })
      expect(() => queueSync('pet_profiles', 'rec-1', 'insert', {}, 'user-123')).not.toThrow()
    })

    it('silently catches error from queueForSync', () => {
      mockQueueForSync.mockImplementationOnce(() => {
        throw new Error('queue failed')
      })
      expect(() => queueSync('pet_profiles', 'rec-1', 'insert', {}, 'user-123')).not.toThrow()
    })
  })

  describe('trySyncAll', () => {
    it('calls getSyncService with userId', () => {
      trySyncAll('user-456')
      expect(getSyncService).toHaveBeenCalledWith('user-456')
    })

    it('calls syncAll', () => {
      trySyncAll('user-456')
      expect(mockSyncAll).toHaveBeenCalled()
    })

    it('silently catches error', () => {
      vi.mocked(getSyncService).mockImplementationOnce(() => {
        throw new Error('sync service error')
      })
      expect(() => trySyncAll('user-456')).not.toThrow()
    })
  })

  describe('trySyncTable', () => {
    it('calls pushTable and pullTable', () => {
      trySyncTable('pet_health_entries', 'user-789')
      expect(mockPushTable).toHaveBeenCalledWith('pet_health_entries')
      expect(mockPullTable).toHaveBeenCalledWith('pet_health_entries')
    })

    it('silently catches error', () => {
      vi.mocked(getSyncService).mockImplementationOnce(() => {
        throw new Error('table sync error')
      })
      expect(() => trySyncTable('pet_health_entries', 'user-789')).not.toThrow()
    })

    it('calls getSyncService with userId', () => {
      trySyncTable('pet_vaccinations', 'user-abc')
      expect(getSyncService).toHaveBeenCalledWith('user-abc')
    })
  })
})
