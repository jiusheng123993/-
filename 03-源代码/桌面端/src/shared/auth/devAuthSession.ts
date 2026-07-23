import type { AuthSession, AuthRole } from './authTypes'
import { AUTH_STORAGE_KEY } from './authTypes'

export type DevAuthRole = 'user' | 'admin'

export interface DevAuthSession {
  userId: string
  role: DevAuthRole
  displayName: string
}

const DEV_AUTH_STORAGE_KEY = 'dev_auth_session'
const DEV_AUTH_USER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/

export const defaultDevUserSession: DevAuthSession = {
  userId: 'dev-user-001',
  role: 'user',
  displayName: '开发用户'
}

export const defaultDevAdminSession: DevAuthSession = {
  userId: 'dev-admin-001',
  role: 'admin',
  displayName: '开发管理员'
}

export function isValidDevAuthSession(session: DevAuthSession | undefined): session is DevAuthSession {
  return Boolean(
    session &&
    DEV_AUTH_USER_ID_PATTERN.test(session.userId) &&
    (session.role === 'user' || session.role === 'admin') &&
    typeof session.displayName === 'string' &&
    session.displayName.trim().length > 0 &&
    session.displayName.length <= 64
  )
}

export function createDevAuthToken(session: DevAuthSession): string {
  if (!isValidDevAuthSession(session)) {
    throw new Error('Invalid dev auth session')
  }
  return `dev-${session.role}:${session.userId}`
}

export function createDevAuthHeaders(session: DevAuthSession): Record<string, string> {
  return {
    Authorization: `Bearer ${createDevAuthToken(session)}`
  }
}

export function loadDevAuthSession(storage: Storage | undefined = getBrowserStorage()): DevAuthSession {
  if (!storage) return defaultDevUserSession

  try {
    const raw = storage.getItem(DEV_AUTH_STORAGE_KEY)
    if (!raw) return defaultDevUserSession
    const parsed = JSON.parse(raw) as DevAuthSession
    return isValidDevAuthSession(parsed) ? parsed : defaultDevUserSession
  } catch {
    return defaultDevUserSession
  }
}

export function saveDevAuthSession(session: DevAuthSession, storage: Storage | undefined = getBrowserStorage()): void {
  if (!isValidDevAuthSession(session)) {
    throw new Error('Invalid dev auth session')
  }
  storage?.setItem(DEV_AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function createRoleSession(role: DevAuthRole): DevAuthSession {
  return role === 'admin' ? defaultDevAdminSession : defaultDevUserSession
}

export function devSessionToAuthSession(dev: DevAuthSession): AuthSession {
  return {
    userId: dev.userId,
    role: dev.role as AuthRole,
    displayName: dev.displayName,
    provider: 'dev',
    accessToken: createDevAuthToken(dev),
    refreshToken: '',
    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000
  }
}

export function loadAuthSession(): AuthSession {
  if (typeof window === 'undefined') {
    return devSessionToAuthSession(defaultDevUserSession)
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AuthSession
      if (parsed.userId && parsed.accessToken) {
        return parsed
      }
    } catch {
      // fall through to dev session
    }
  }

  const devSession = loadDevAuthSession()
  return devSessionToAuthSession(devSession)
}

export function saveAuthSession(session: AuthSession): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function createAuthHeaders(session: AuthSession): Record<string, string> {
  if (session.provider === 'dev') {
    return createDevAuthHeaders({
      userId: session.userId,
      role: session.role as DevAuthRole,
      displayName: session.displayName
    })
  }
  return {
    Authorization: `Bearer ${session.accessToken}`
  }
}

function getBrowserStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined
  return window.localStorage
}
