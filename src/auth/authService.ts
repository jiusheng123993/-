import type { AuthSession, AuthResult, LoginRequest, RegisterRequest } from './authTypes'
import { isRealAuth } from './authTypes'
import { getAuthProvider } from './authProviders'
import { loadAuthSession, saveAuthSession, clearAuthSession, devSessionToAuthSession, loadDevAuthSession } from './devAuthSession'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface AuthService {
  getSession(): AuthSession
  login(request: LoginRequest): Promise<AuthResult>
  register(request: RegisterRequest): Promise<AuthResult>
  logout(): void
  refreshToken(): Promise<AuthResult>
  isAuthenticated(): boolean
  bindDevice(deviceName: string): Promise<boolean>
}

export function createAuthService(): AuthService {
  let currentSession: AuthSession = loadAuthSession()

  const persistSession = (session: AuthSession) => {
    currentSession = session
    saveAuthSession(session)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('user_id', session.userId)
    }
  }

  return {
    getSession(): AuthSession {
      return currentSession
    },

    async login(request: LoginRequest): Promise<AuthResult> {
      if (!isRealAuth(request.provider)) {
        const devSession = loadDevAuthSession()
        const session = devSessionToAuthSession(devSession)
        persistSession(session)
        return { success: true, session }
      }

      try {
        const provider = getAuthProvider(request.provider)
        const code = await provider.getAuthCode()
        const userInfo = await provider.getUserInfo(code)

        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: request.provider,
            code,
            phoneNumber: request.phoneNumber
          })
        })

        const data = await response.json()

        if (!response.ok) {
          if (response.status === 404 && data.needRegister) {
            return {
              success: false,
              needRegister: true,
              providerUserId: userInfo.providerUserId,
              error: '用户未注册，请先注册'
            }
          }
          return { success: false, error: data.error || '登录失败' }
        }

        const session: AuthSession = {
          userId: data.userId,
          role: data.role || 'user',
          displayName: data.displayName || userInfo.displayName,
          provider: request.provider,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: Date.now() + (data.expiresIn || 7200) * 1000,
          phoneNumber: data.phoneNumber,
          avatarUrl: data.avatarUrl || userInfo.avatarUrl
        }

        persistSession(session)
        return { success: true, session }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    },

    async register(request: RegisterRequest): Promise<AuthResult> {
      if (!isRealAuth(request.provider)) {
        const devSession = loadDevAuthSession()
        const session = devSessionToAuthSession(devSession)
        persistSession(session)
        return { success: true, session }
      }

      try {
        const provider = getAuthProvider(request.provider)
        const code = await provider.getAuthCode()

        const response = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: request.provider,
            code,
            phoneNumber: request.phoneNumber,
            displayName: request.displayName,
            age: request.age
          })
        })

        const data = await response.json()

        if (!response.ok) {
          return { success: false, error: data.error || '注册失败' }
        }

        const session: AuthSession = {
          userId: data.userId,
          role: data.role || 'user',
          displayName: data.displayName || request.displayName,
          provider: request.provider,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: Date.now() + (data.expiresIn || 7200) * 1000,
          phoneNumber: request.phoneNumber,
          avatarUrl: data.avatarUrl
        }

        persistSession(session)
        return { success: true, session }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    },

    logout(): void {
      clearAuthSession()
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('user_id')
      }
      const devSession = loadDevAuthSession()
      currentSession = devSessionToAuthSession(devSession)
    },

    async refreshToken(): Promise<AuthResult> {
      if (!isRealAuth(currentSession.provider)) {
        return { success: true, session: currentSession }
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: currentSession.refreshToken })
        })

        const data = await response.json()

        if (!response.ok) {
          return { success: false, error: data.error || 'Token 刷新失败' }
        }

        const session: AuthSession = {
          ...currentSession,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: Date.now() + (data.expiresIn || 7200) * 1000
        }

        persistSession(session)
        return { success: true, session }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    },

    isAuthenticated(): boolean {
      if (!isRealAuth(currentSession.provider)) return true
      return currentSession.expiresAt > Date.now()
    },

    async bindDevice(deviceName: string): Promise<boolean> {
      if (!isRealAuth(currentSession.provider)) return true

      try {
        const response = await fetch(`${API_BASE}/api/auth/bind-device`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentSession.accessToken}`
          },
          body: JSON.stringify({ deviceName })
        })
        return response.ok
      } catch {
        return false
      }
    }
  }
}

let instance: AuthService | null = null

export function getAuthService(): AuthService {
  if (!instance) {
    instance = createAuthService()
  }
  return instance
}
