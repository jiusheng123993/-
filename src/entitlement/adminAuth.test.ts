import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createAdminAuth, adminAuth, type AdminRole } from './adminAuth'

describe('AdminAuth', () => {
  let adminAuthInstance: ReturnType<typeof createAdminAuth>

  beforeEach(() => {
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    })
    adminAuthInstance = createAdminAuth()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('login', () => {
    it('should login successfully with correct credentials', () => {
      const result = adminAuthInstance.login('admin', 'admin123')
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should login with superadmin credentials', () => {
      const result = adminAuthInstance.login('superadmin', 'super123')
      expect(result.success).toBe(true)
    })

    it('should fail with wrong password', () => {
      const result = adminAuthInstance.login('admin', 'wrongpassword')
      expect(result.success).toBe(false)
      expect(result.error).toBe('密码错误')
    })

    it('should fail with non-existent username', () => {
      const result = adminAuthInstance.login('unknown', 'anypassword')
      expect(result.success).toBe(false)
      expect(result.error).toBe('用户名不存在')
    })
  })

  describe('session management', () => {
    it('should check authentication status', () => {
      vi.mocked(window.sessionStorage.getItem).mockReturnValue(null)
      expect(adminAuthInstance.isAuthenticated()).toBe(false)

      const mockUser = {
        id: 'admin-1',
        username: 'admin',
        role: 'admin' as AdminRole,
        loginAt: new Date().toISOString()
      }
      vi.mocked(window.sessionStorage.getItem).mockReturnValue(JSON.stringify(mockUser))
      expect(adminAuthInstance.isAuthenticated()).toBe(true)
    })

    it('should get current user', () => {
      const mockUser = {
        id: 'admin-1',
        username: 'admin',
        role: 'admin' as AdminRole,
        loginAt: new Date().toISOString()
      }
      vi.mocked(window.sessionStorage.getItem).mockReturnValue(JSON.stringify(mockUser))

      const user = adminAuthInstance.getCurrentUser()
      expect(user).toBeDefined()
      expect(user?.username).toBe('admin')
      expect(user?.role).toBe('admin')
    })

    it('should return null when no session', () => {
      vi.mocked(window.sessionStorage.getItem).mockReturnValue(null)
      expect(adminAuthInstance.getCurrentUser()).toBeNull()
    })

    it('should logout and clear session', () => {
      adminAuthInstance.logout()
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('growthos-admin-session')
    })
  })

  describe('requireAuth', () => {
    it('should throw error when not authenticated', () => {
      vi.mocked(window.sessionStorage.getItem).mockReturnValue(null)
      expect(() => adminAuthInstance.requireAuth()).toThrow('需要管理员权限')
    })

    it('should not throw when authenticated', () => {
      const mockUser = {
        id: 'admin-1',
        username: 'admin',
        role: 'admin' as AdminRole,
        loginAt: new Date().toISOString()
      }
      vi.mocked(window.sessionStorage.getItem).mockReturnValue(JSON.stringify(mockUser))
      expect(() => adminAuthInstance.requireAuth()).not.toThrow()
    })
  })

  describe('exported instance', () => {
    it('should have all required methods', () => {
      expect(typeof adminAuth.isAuthenticated).toBe('function')
      expect(typeof adminAuth.getCurrentUser).toBe('function')
      expect(typeof adminAuth.login).toBe('function')
      expect(typeof adminAuth.logout).toBe('function')
      expect(typeof adminAuth.requireAuth).toBe('function')
    })
  })
})
