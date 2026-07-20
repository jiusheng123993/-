import { useState, useEffect, useCallback } from 'react'
import { getAuthService, type AuthService } from '../auth/authService'
import type { AuthSession, AuthResult, LoginRequest, RegisterRequest } from '../auth/authTypes'
import { isRealAuth } from '../auth/authTypes'
import { createRoleSession, devSessionToAuthSession } from '../auth/devAuthSession'

export function useAuth() {
  const [authService] = useState<AuthService>(() => getAuthService())
  const [session, setSession] = useState<AuthSession>(() => authService.getSession())
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  useEffect(() => {
    const handleStorageChange = () => {
      setSession(authService.getSession())
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [authService])

  const login = useCallback(async (request: LoginRequest): Promise<AuthResult> => {
    setIsLoggingIn(true)
    setLoginError(null)
    const result = await authService.login(request)
    if (result.success && result.session) {
      setSession(result.session)
    } else {
      setLoginError(result.error || '登录失败')
    }
    setIsLoggingIn(false)
    return result
  }, [authService])

  const register = useCallback(async (request: RegisterRequest): Promise<AuthResult> => {
    setIsLoggingIn(true)
    setLoginError(null)
    const result = await authService.register(request)
    if (result.success && result.session) {
      setSession(result.session)
    } else {
      setLoginError(result.error || '注册失败')
    }
    setIsLoggingIn(false)
    return result
  }, [authService])

  const logout = useCallback(() => {
    authService.logout()
    setSession(authService.getSession())
    setLoginError(null)
  }, [authService])

  const refreshToken = useCallback(async (): Promise<AuthResult> => {
    const result = await authService.refreshToken()
    if (result.success && result.session) {
      setSession(result.session)
    }
    return result
  }, [authService])

  const switchRole = useCallback(() => {
    const newDevSession = createRoleSession(session.role === 'admin' ? 'user' : 'admin')
    const newSession = devSessionToAuthSession(newDevSession)
    setSession(newSession)
  }, [session])

  const bindDevice = useCallback(async (deviceName: string): Promise<boolean> => {
    return authService.bindDevice(deviceName)
  }, [authService])

  return {
    session,
    login,
    register,
    logout,
    refreshToken,
    switchRole,
    bindDevice,
    isLoggingIn,
    loginError,
    userId: session.userId,
    role: session.role,
    displayName: session.displayName,
    provider: session.provider,
    isRealAuth: isRealAuth(session.provider),
    isAuthenticated: authService.isAuthenticated()
  }
}
