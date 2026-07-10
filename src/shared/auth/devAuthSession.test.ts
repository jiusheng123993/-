import { describe, expect, it, vi } from 'vitest'
import {
  createDevAuthHeaders,
  createDevAuthToken,
  createRoleSession,
  defaultDevAdminSession,
  defaultDevUserSession,
  isValidDevAuthSession,
  loadDevAuthSession,
  saveDevAuthSession,
  type DevAuthSession
} from './devAuthSession'

function createMemoryStorage(initial?: Record<string, string>): Storage {
  const data = new Map(Object.entries(initial || {}))
  return {
    get length() {
      return data.size
    },
    clear: vi.fn(() => data.clear()),
    getItem: vi.fn((key: string) => data.get(key) || null),
    key: vi.fn((index: number) => Array.from(data.keys())[index] || null),
    removeItem: vi.fn((key: string) => data.delete(key)),
    setItem: vi.fn((key: string, value: string) => data.set(key, value))
  }
}

describe('devAuthSession', () => {
  it('creates user dev token', () => {
    expect(createDevAuthToken(defaultDevUserSession)).toBe('dev-user:dev-user-001')
  })

  it('creates admin dev token', () => {
    expect(createDevAuthToken(defaultDevAdminSession)).toBe('dev-admin:dev-admin-001')
  })

  it('creates Authorization header', () => {
    expect(createDevAuthHeaders(defaultDevUserSession)).toEqual({
      Authorization: 'Bearer dev-user:dev-user-001'
    })
  })

  it('validates safe session ids', () => {
    expect(isValidDevAuthSession({ userId: 'user_1-2', role: 'user', displayName: '用户' })).toBe(true)
  })

  it('rejects unsafe session ids', () => {
    expect(isValidDevAuthSession({ userId: '../evil', role: 'user', displayName: '用户' })).toBe(false)
  })

  it('throws when creating token for invalid session', () => {
    expect(() => createDevAuthToken({ userId: '../evil', role: 'user', displayName: '用户' })).toThrow('Invalid dev auth session')
  })

  it('loads default user session when storage is missing', () => {
    expect(loadDevAuthSession(undefined)).toEqual(defaultDevUserSession)
  })

  it('loads saved session from storage', () => {
    const session: DevAuthSession = { userId: 'dev-admin-002', role: 'admin', displayName: '管理员2' }
    const storage = createMemoryStorage({ dev_auth_session: JSON.stringify(session) })

    expect(loadDevAuthSession(storage)).toEqual(session)
  })

  it('falls back to default when storage value is invalid', () => {
    const storage = createMemoryStorage({ dev_auth_session: '{bad json' })

    expect(loadDevAuthSession(storage)).toEqual(defaultDevUserSession)
  })

  it('saves valid session', () => {
    const storage = createMemoryStorage()
    const session: DevAuthSession = { userId: 'dev-admin-002', role: 'admin', displayName: '管理员2' }

    saveDevAuthSession(session, storage)

    expect(storage.setItem).toHaveBeenCalledWith('dev_auth_session', JSON.stringify(session))
  })

  it('creates default role session', () => {
    expect(createRoleSession('user')).toEqual(defaultDevUserSession)
    expect(createRoleSession('admin')).toEqual(defaultDevAdminSession)
  })
})
