import { describe, it, expect, vi, beforeEach } from 'vitest'

const memoryStore = new Map<string, unknown>()

const { mockSelect, mockSelectOne, mockInsert, mockUpdate } = vi.hoisted(() => ({
  mockSelect: vi.fn<() => Promise<{ data: unknown; error: string | null; status: number }>>(),
  mockSelectOne: vi.fn<() => Promise<{ data: unknown; error: string | null; status: number }>>(),
  mockInsert: vi.fn<() => Promise<{ data: unknown; error: string | null; status: number }>>(),
  mockUpdate: vi.fn<() => Promise<{ data: unknown; error: string | null; status: number }>>(),
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    getStorageSync: vi.fn((key: string) => memoryStore.get(key) ?? ''),
    setStorageSync: vi.fn((key: string, value: unknown) => { memoryStore.set(key, value) }),
    removeStorageSync: vi.fn((key: string) => { memoryStore.delete(key) }),
    clearStorageSync: vi.fn(),
    request: vi.fn(() => Promise.resolve({ statusCode: 200, data: {} })),
  },
}))

vi.mock('../supabaseClient', () => ({
  supabaseClient: {
    select: mockSelect,
    selectOne: mockSelectOne,
    insert: mockInsert,
    update: mockUpdate,
    isMock: true,
  },
}))

vi.mock('../../config/supabase', () => ({
  ENV: {
    development: {
      apiBaseUrl: 'http://localhost:3000',
      supabaseUrl: 'http://localhost:54321',
      supabaseKey: 'mock-key',
      useMock: true,
    },
  },
  STORAGE_KEYS: {
    TOKEN: 'xhh_token',
  },
}))

vi.mock('../../constants', () => ({
  INVITE_CODE_LENGTH: 6,
  INVITE_CODE_MAX_USE: 50,
}))

import {
  getOrCreateInviteCode,
  recordShare,
  getShareStats,
  processReferral,
  getLocalShareHistory,
  clearLocalShareHistory,
} from '../shareService'

describe('shareService', () => {
  beforeEach(() => {
    memoryStore.clear()
    mockSelect.mockReset()
    mockSelectOne.mockReset()
    mockInsert.mockReset()
    mockUpdate.mockReset()
    mockSelect.mockResolvedValue({ data: [], error: null, status: 200 })
    mockSelectOne.mockResolvedValue({ data: null, error: null, status: 200 })
    mockInsert.mockResolvedValue({ data: null, error: null, status: 200 })
    mockUpdate.mockResolvedValue({ data: null, error: null, status: 200 })
  })

  describe('getOrCreateInviteCode', () => {
    it('returns cached code when available', async () => {
      memoryStore.set('xhh_invite_code', 'ABC123')
      const code = await getOrCreateInviteCode('user-1')
      expect(code).toBe('ABC123')
      expect(mockSelect).not.toHaveBeenCalled()
    })

    it('creates new code when none cached and DB has none', async () => {
      mockSelect.mockResolvedValue({ data: [], error: null, status: 200 })
      mockInsert.mockResolvedValue({ data: null, error: null, status: 200 })
      const code = await getOrCreateInviteCode('user-1')
      expect(code).toHaveLength(6)
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]+$/)
      expect(mockSelect).toHaveBeenCalledWith('invite_codes', { user_id: 'eq.user-1' })
      expect(mockInsert).toHaveBeenCalledWith('invite_codes', expect.objectContaining({
        code,
        user_id: 'user-1',
        use_count: 0,
        max_use_count: 50,
      }))
      expect(memoryStore.get('xhh_invite_code')).toBe(code)
    })

    it('returns existing code from DB when none cached', async () => {
      mockSelect.mockResolvedValue({
        data: [{ code: 'XYZ789', user_id: 'user-1', created_at: '2025-01-01', use_count: 0, max_use_count: 50 }],
        error: null,
        status: 200,
      })
      const code = await getOrCreateInviteCode('user-1')
      expect(code).toBe('XYZ789')
      expect(memoryStore.get('xhh_invite_code')).toBe('XYZ789')
      expect(mockInsert).not.toHaveBeenCalled()
    })
  })

  describe('recordShare', () => {
    it('records share and returns record', async () => {
      const shareRecord = {
        id: 'rec-1',
        userId: 'user-1',
        cardType: 'food',
        petId: 'pet-1',
        sharedAt: '2025-01-01T00:00:00Z',
        platform: 'wechat',
        inviteCode: 'ABC123',
      }
      memoryStore.set('xhh_invite_code', 'ABC123')
      mockInsert.mockResolvedValue({ data: [shareRecord], error: null, status: 200 })
      const result = await recordShare('user-1', 'food', 'pet-1', 'wechat')
      expect(result).toEqual(shareRecord)
      expect(mockInsert).toHaveBeenCalledWith('share_records', expect.objectContaining({
        user_id: 'user-1',
        card_type: 'food',
        pet_id: 'pet-1',
        platform: 'wechat',
        invite_code: 'ABC123',
      }))
      const history = memoryStore.get('xhh_share_history') as unknown[]
      expect(history).toHaveLength(1)
    })

    it('returns null on failure', async () => {
      memoryStore.set('xhh_invite_code', 'ABC123')
      mockInsert.mockResolvedValue({ data: null, error: 'insert failed', status: 500 })
      const result = await recordShare('user-1', 'food', 'pet-1', 'wechat')
      expect(result).toBeNull()
    })
  })

  describe('getShareStats', () => {
    it('returns stats from local history and DB referrals', async () => {
      memoryStore.set('xhh_share_history', [
        { id: '1', userId: 'user-1', cardType: 'food', petId: 'pet-1', sharedAt: '2025-01-01', platform: 'wechat', inviteCode: 'ABC' },
        { id: '2', userId: 'user-1', cardType: 'food', petId: 'pet-1', sharedAt: '2025-01-02', platform: 'wechat', inviteCode: 'ABC' },
        { id: '3', userId: 'user-1', cardType: 'health_trend', petId: 'pet-1', sharedAt: '2025-01-03', platform: 'wechat', inviteCode: 'ABC' },
        { id: '4', userId: 'user-1', cardType: 'vaccine', petId: 'pet-1', sharedAt: '2025-01-04', platform: 'wechat', inviteCode: 'ABC' },
      ])
      mockSelect.mockResolvedValue({
        data: [
          { id: 'r1', inviterId: 'user-1', inviteeId: 'user-2', inviteCode: 'ABC', registeredAt: '2025-01-05', rewardGranted: true },
          { id: 'r2', inviterId: 'user-1', inviteeId: 'user-3', inviteCode: 'ABC', registeredAt: '2025-01-06', rewardGranted: false },
        ],
        error: null,
        status: 200,
      })
      const stats = await getShareStats('user-1')
      expect(stats.totalShares).toBe(4)
      expect(stats.foodShares).toBe(2)
      expect(stats.trendShares).toBe(1)
      expect(stats.vaccineShares).toBe(1)
      expect(stats.totalInvites).toBe(2)
      expect(stats.successfulInvites).toBe(1)
    })
  })

  describe('processReferral', () => {
    it('succeeds with valid code', async () => {
      mockSelectOne.mockResolvedValue({
        data: { code: 'ABC123', userId: 'inviter-1', createdAt: '2025-01-01', useCount: 0, maxUseCount: 50 },
        error: null,
        status: 200,
      })
      mockInsert.mockResolvedValue({ data: null, error: null, status: 200 })
      mockUpdate.mockResolvedValue({ data: null, error: null, status: 200 })
      const result = await processReferral('ABC123', 'new-user-1')
      expect(result).toBe(true)
      expect(mockSelectOne).toHaveBeenCalledWith('invite_codes', { code: 'eq.ABC123' })
      expect(mockInsert).toHaveBeenCalledWith('referral_records', expect.objectContaining({
        inviter_id: 'inviter-1',
        invitee_id: 'new-user-1',
        invite_code: 'ABC123',
        reward_granted: false,
      }))
      expect(mockUpdate).toHaveBeenCalledWith('invite_codes', { use_count: 1 }, { code: 'eq.ABC123' })
    })

    it('fails with expired code when useCount >= maxUseCount', async () => {
      mockSelectOne.mockResolvedValue({
        data: { code: 'ABC123', userId: 'inviter-1', createdAt: '2025-01-01', useCount: 50, maxUseCount: 50 },
        error: null,
        status: 200,
      })
      const result = await processReferral('ABC123', 'new-user-1')
      expect(result).toBe(false)
      expect(mockInsert).not.toHaveBeenCalled()
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('fails when code not found', async () => {
      mockSelectOne.mockResolvedValue({ data: null, error: null, status: 200 })
      const result = await processReferral('NOTFND', 'new-user-1')
      expect(result).toBe(false)
      expect(mockInsert).not.toHaveBeenCalled()
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe('getLocalShareHistory', () => {
    it('returns empty array when no history', () => {
      const history = getLocalShareHistory()
      expect(history).toEqual([])
    })

    it('returns stored history', () => {
      const records = [
        { id: '1', userId: 'user-1', cardType: 'food', petId: 'pet-1', sharedAt: '2025-01-01', platform: 'wechat', inviteCode: 'ABC' },
      ]
      memoryStore.set('xhh_share_history', records)
      const history = getLocalShareHistory()
      expect(history).toEqual(records)
    })
  })

  describe('clearLocalShareHistory', () => {
    it('clears history', () => {
      memoryStore.set('xhh_share_history', [
        { id: '1', userId: 'user-1', cardType: 'food', petId: 'pet-1', sharedAt: '2025-01-01', platform: 'wechat', inviteCode: 'ABC' },
      ])
      clearLocalShareHistory()
      expect(memoryStore.has('xhh_share_history')).toBe(false)
      expect(getLocalShareHistory()).toEqual([])
    })
  })
})
