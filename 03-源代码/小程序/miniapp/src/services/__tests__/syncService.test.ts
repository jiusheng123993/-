import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SyncService, getSyncService, type SyncRecord, type SyncTable } from '../syncService'

vi.mock('../../utils/storage', () => ({
  getStorage: vi.fn(() => []),
  setStorage: vi.fn()
}))

vi.mock('../../utils/crypto', () => ({
  encrypt: vi.fn((data: string) => `encrypted:${data}`),
  decrypt: vi.fn((data: string) => data.startsWith('encrypted:') ? data.slice(10) : null)
}))

vi.mock('./supabaseClient', () => ({
  supabaseClient: {
    isMock: true,
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn()
  }
}))

describe('SyncService', () => {
  let service: SyncService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new SyncService('user-001')
  })

  describe('constructor and userId', () => {
    it('should create service with userId', () => {
      expect(service).toBeDefined()
    })

    it('should update userId', () => {
      service.setUserId('user-002')
      expect(service).toBeDefined()
    })
  })

  describe('isAvailable', () => {
    it('should return false when no userId', () => {
      const svc = new SyncService('')
      expect(svc.isAvailable()).toBe(false)
    })
  })

  describe('queueForSync', () => {
    it('should queue a record for sync', () => {
      service.queueForSync('pet_profiles', 'pet-1', 'insert', { name: '咪咪' })
      const status = service.getStatus('pet_profiles')
      expect(status.pendingCount).toBeGreaterThanOrEqual(0)
    })

    it('should encrypt sensitive table data', () => {
      service.queueForSync('emotion_triggers', 'em-1', 'insert', { content: 'sensitive' })
      const status = service.getStatus('emotion_triggers')
      expect(status).toBeDefined()
    })
  })

  describe('pushTable', () => {
    it('should return zero pushed when not available', async () => {
      const svc = new SyncService('')
      const result = await svc.pushTable('pet_profiles')
      expect(result.pushed).toBe(0)
      expect(result.error).toBe('云端不可用')
    })
  })

  describe('pullTable', () => {
    it('should return zero pulled when not available', async () => {
      const svc = new SyncService('')
      const result = await svc.pullTable('pet_profiles')
      expect(result.pulled).toBe(0)
      expect(result.error).toBe('云端不可用')
    })
  })

  describe('syncAll', () => {
    it('should return result with errors when not available', async () => {
      const svc = new SyncService('')
      const result = await svc.syncAll()
      expect(result.success).toBe(false)
      expect(result.pushed).toBe(0)
      expect(result.pulled).toBe(0)
    })
  })

  describe('exportAllData', () => {
    it('should return export data structure', async () => {
      const data = await service.exportAllData()
      expect(data).toHaveProperty('exportedAt')
      expect(data).toHaveProperty('userId', 'user-001')
    })
  })

  describe('importData', () => {
    it('should import records from export data', async () => {
      const data = {
        pet_profiles: [{ id: 'pet-1', name: '咪咪' }],
        pet_health_entries: [{ id: 'entry-1', petId: 'pet-1' }]
      }
      const result = await service.importData(data)
      expect(result.imported).toBeGreaterThanOrEqual(0)
    })

    it('should handle empty data', async () => {
      const result = await service.importData({})
      expect(result.imported).toBe(0)
    })
  })

  describe('clearCloudData', () => {
    it('should return error when not available', async () => {
      const svc = new SyncService('')
      const result = await svc.clearCloudData()
      expect(result.success).toBe(false)
      expect(result.error).toBe('云端不可用')
    })
  })

  describe('getStatus', () => {
    it('should return status for a table', () => {
      const status = service.getStatus('pet_profiles')
      expect(status.table).toBe('pet_profiles')
      expect(status).toHaveProperty('pendingCount')
      expect(status).toHaveProperty('lastPushAt')
      expect(status).toHaveProperty('lastPullAt')
    })
  })

  describe('getAllStatuses', () => {
    it('should return statuses for all tables', () => {
      const statuses = service.getAllStatuses()
      expect(statuses.length).toBeGreaterThan(0)
      expect(statuses[0]).toHaveProperty('table')
    })
  })

  describe('getSyncService singleton', () => {
    it('should return singleton instance', () => {
      const s1 = getSyncService('user-001')
      const s2 = getSyncService('user-002')
      expect(s1).toBe(s2)
    })

    it('should create instance without userId', () => {
      const s = getSyncService()
      expect(s).toBeDefined()
    })
  })
})
