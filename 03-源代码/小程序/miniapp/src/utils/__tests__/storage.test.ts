import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockStore: Record<string, string> = {}

const { mockEncrypt, mockDecrypt } = vi.hoisted(() => ({
  mockEncrypt: vi.fn((data: string, userId: string) => `encrypted_${userId}_${data}`),
  mockDecrypt: vi.fn((data: string, userId: string) => {
    if (data.startsWith('encrypted_')) {
      const parts = data.split('_')
      return parts.slice(2).join('_')
    }
    return ''
  }),
}))

vi.mock('../crypto', () => ({
  encrypt: mockEncrypt,
  decrypt: mockDecrypt,
}))

vi.mock('@tarojs/taro', () => {
  const taroMock = {
    getStorageSync: vi.fn((key: string) => mockStore[key] ?? ''),
    setStorageSync: vi.fn((key: string, value: string) => { mockStore[key] = value }),
    removeStorageSync: vi.fn((key: string) => { delete mockStore[key] }),
    getStorageInfoSync: vi.fn(() => ({ keys: Object.keys(mockStore) })),
  }
  return { default: taroMock, ...taroMock }
})

import {
  getStorage,
  getStorageArray,
  setStorage,
  removeStorage,
  clearAllStorage,
  setStorageUserId,
} from '../storage'

describe('storage', () => {
  beforeEach(() => {
    Object.keys(mockStore).forEach(k => delete mockStore[k])
    mockEncrypt.mockClear()
    mockDecrypt.mockClear()
    setStorageUserId('')
  })

  describe('getStorage', () => {
    it('returns null for missing key', () => {
      expect(getStorage('nonexistent')).toBeNull()
    })

    it('returns parsed JSON for existing key', () => {
      mockStore['xhh_settings'] = '{"theme":"dark"}'
      expect(getStorage('settings')).toEqual({ theme: 'dark' })
    })

    it('returns null for invalid JSON', () => {
      mockStore['xhh_bad'] = '{invalid json'
      expect(getStorage('bad')).toBeNull()
    })

    it('returns null for empty string value', () => {
      mockStore['xhh_empty'] = ''
      expect(getStorage('empty')).toBeNull()
    })

    it('returns null for encrypted data when no userId set', () => {
      mockStore['xhh_health_entries'] = 'enc:someencrypteddata'
      expect(getStorage('health_entries')).toBeNull()
    })

    it('decrypts and returns data when userId is set', () => {
      setStorageUserId('user123')
      mockStore['xhh_health_entries'] = 'enc:encrypted_user123_{"heartRate":72}'
      const result = getStorage('health_entries')
      expect(mockDecrypt).toHaveBeenCalled()
      expect(result).toEqual({ heartRate: 72 })
    })

    it('returns null when decrypt returns empty string', () => {
      setStorageUserId('user123')
      mockStore['xhh_health_entries'] = 'enc:garbage'
      mockDecrypt.mockReturnValueOnce('')
      expect(getStorage('health_entries')).toBeNull()
    })

    it('returns null when decrypted data is invalid JSON', () => {
      setStorageUserId('user123')
      mockStore['xhh_health_entries'] = 'enc:encrypted_user123_badjson'
      mockDecrypt.mockReturnValueOnce('not json')
      expect(getStorage('health_entries')).toBeNull()
    })

    it('handles numeric values stored as JSON', () => {
      mockStore['xhh_count'] = '42'
      expect(getStorage<number>('count')).toBe(42)
    })

    it('handles array values stored as JSON', () => {
      mockStore['xhh_items'] = '[1,2,3]'
      expect(getStorage<number[]>('items')).toEqual([1, 2, 3])
    })
  })

  describe('getStorageArray', () => {
    it('returns empty array for missing key', () => {
      expect(getStorageArray('nonexistent')).toEqual([])
    })

    it('returns stored array', () => {
      mockStore['xhh_items'] = '[1,2,3]'
      expect(getStorageArray<number>('items')).toEqual([1, 2, 3])
    })

    it('returns empty array when stored value is null', () => {
      mockStore['xhh_missing'] = ''
      expect(getStorageArray('missing')).toEqual([])
    })
  })

  describe('setStorage', () => {
    it('stores JSON string with prefix', () => {
      setStorage('settings', { theme: 'light' })
      expect(mockStore['xhh_settings']).toBe('{"theme":"light"}')
    })

    it('encrypts sensitive keys when encryption enabled and userId set', () => {
      setStorageUserId('user123')
      setStorage('health_entries', { heartRate: 72 })
      expect(mockEncrypt).toHaveBeenCalledWith('{"heartRate":72}', 'user123')
      expect(mockStore['xhh_health_entries']).toContain('enc:')
    })

    it('does not encrypt when encryption disabled', () => {
      setStorageUserId('user123')
      setStorage('health_entries', { heartRate: 72 })
      expect(mockEncrypt).not.toHaveBeenCalled()
      expect(mockStore['xhh_health_entries']).toBe('{"heartRate":72}')
    })

    it('does not encrypt non-sensitive keys', () => {
      setStorageUserId('user123')
      setStorage('settings', { theme: 'dark' })
      expect(mockEncrypt).not.toHaveBeenCalled()
      expect(mockStore['xhh_settings']).toBe('{"theme":"dark"}')
    })

    it('does not encrypt when no userId set', () => {
      setStorage('health_entries', { heartRate: 72 })
      expect(mockEncrypt).not.toHaveBeenCalled()
      expect(mockStore['xhh_health_entries']).toBe('{"heartRate":72}')
    })

    it('encrypts vaccination keys', () => {
      setStorageUserId('user123')
      setStorage('vaccinations', [{ name: 'flu' }])
      expect(mockEncrypt).toHaveBeenCalledWith('[{"name":"flu"}]', 'user123')
      expect(mockStore['xhh_vaccinations']).toContain('enc:')
    })

    it('encrypts membership keys', () => {
      setStorageUserId('user123')
      setStorage('membership', { level: 'gold' })
      expect(mockEncrypt).toHaveBeenCalledWith('{"level":"gold"}', 'user123')
      expect(mockStore['xhh_membership']).toContain('enc:')
    })

    it('encrypts membership_orders keys', () => {
      setStorageUserId('user123')
      setStorage('membership_orders', [{ id: '1' }])
      expect(mockEncrypt).toHaveBeenCalled()
      expect(mockStore['xhh_membership_orders']).toContain('enc:')
    })

    it('stores string values as JSON', () => {
      setStorage('token', 'abc123')
      expect(mockStore['xhh_token']).toBe('"abc123"')
    })

    it('stores null value as JSON', () => {
      setStorage('nullable', null)
      expect(mockStore['xhh_nullable']).toBe('null')
    })
  })

  describe('removeStorage', () => {
    it('removes key with prefix', () => {
      mockStore['xhh_settings'] = '{"theme":"dark"}'
      removeStorage('settings')
      expect(mockStore['xhh_settings']).toBeUndefined()
    })

    it('does not affect keys without prefix', () => {
      mockStore['other_key'] = 'value'
      removeStorage('other_key')
      expect(mockStore['other_key']).toBe('value')
      expect(mockStore['xhh_other_key']).toBeUndefined()
    })
  })

  describe('clearAllStorage', () => {
    it('removes all keys with prefix', () => {
      mockStore['xhh_a'] = '1'
      mockStore['xhh_b'] = '2'
      mockStore['xhh_c'] = '3'
      clearAllStorage()
      expect(mockStore['xhh_a']).toBeUndefined()
      expect(mockStore['xhh_b']).toBeUndefined()
      expect(mockStore['xhh_c']).toBeUndefined()
    })

    it('keeps keys without prefix', () => {
      mockStore['xhh_a'] = '1'
      mockStore['other_key'] = 'value'
      clearAllStorage()
      expect(mockStore['xhh_a']).toBeUndefined()
      expect(mockStore['other_key']).toBe('value')
    })

    it('handles empty storage', () => {
      expect(() => clearAllStorage()).not.toThrow()
    })
  })

  describe('setStorageUserId', () => {
    it('enables encryption for sensitive keys when userId is set', () => {
      setStorage('health_entries', { data: 'before' })
      expect(mockEncrypt).not.toHaveBeenCalled()
      setStorageUserId('user456')
      setStorage('health_entries', { data: 'after' })
      expect(mockEncrypt).toHaveBeenCalledWith('{"data":"after"}', 'user456')
    })

    it('allows decryption with the set userId', () => {
      setStorageUserId('user789')
      mockStore['xhh_health_entries'] = 'enc:encrypted_user789_{"value":1}'
      getStorage('health_entries')
      expect(mockDecrypt).toHaveBeenCalled()
    })
  })

  describe('sensitive key detection', () => {
    beforeEach(() => {
      setStorageUserId('user1')
    })

    it('detects health_entries as sensitive', () => {
      setStorage('health_entries', {})
      expect(mockEncrypt).toHaveBeenCalled()
    })

    it('detects vaccinations as sensitive', () => {
      setStorage('vaccinations', [])
      expect(mockEncrypt).toHaveBeenCalled()
    })

    it('detects membership as sensitive', () => {
      setStorage('membership', {})
      expect(mockEncrypt).toHaveBeenCalled()
    })

    it('detects health_entries as sensitive', () => {
      setStorage('health_entries', [])
      expect(mockEncrypt).toHaveBeenCalled()
    })

    it('detects vaccinations as sensitive', () => {
      setStorage('vaccinations', [])
      expect(mockEncrypt).toHaveBeenCalled()
    })

    it('does not treat settings as sensitive', () => {
      setStorage('settings', {})
      expect(mockEncrypt).not.toHaveBeenCalled()
    })

    it('treats token as sensitive', () => {
      setStorage('token', 'abc')
      expect(mockEncrypt).toHaveBeenCalled()
    })

    it('detects keys containing sensitive pattern as substring', () => {
      setStorage('user_health_entries_backup', [])
      expect(mockEncrypt).toHaveBeenCalled()
    })
  })
})
