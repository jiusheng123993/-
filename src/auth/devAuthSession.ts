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

function getBrowserStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined
  return window.localStorage
}
