/**
 * AdminAuth - 管理员认证模块
 *
 * 职责：
 * - 验证管理员身份
 * - 管理登录会话
 * - 权限级别控制
 *
 * 设计要点：
 * - 简单密码验证（生产环境应使用更安全的方案）
 * - 会话存储在 sessionStorage，刷新页面需要重新登录
 * - 权限分为 admin 和 superadmin
 */

export type AdminRole = 'admin' | 'superadmin'

export interface AdminUser {
  id: string
  username: string
  role: AdminRole
  loginAt: string
}

const ADMIN_STORAGE_KEY = 'growthos-admin-session'

function getAdminCredentials(): Record<string, { password: string; role: AdminRole }> {
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || ''
  const superadminPassword = import.meta.env.VITE_SUPERADMIN_PASSWORD || ''
  return {
    admin: { password: adminPassword, role: 'admin' },
    superadmin: { password: superadminPassword, role: 'superadmin' }
  }
}

export interface AdminAuth {
  isAuthenticated(): boolean
  getCurrentUser(): AdminUser | null
  login(username: string, password: string): { success: boolean; error?: string }
  logout(): void
  requireAuth(): void
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function createAdminAuth(): AdminAuth {
  const getSession = (): AdminUser | null => {
    if (!isBrowser()) return null
    const raw = window.sessionStorage.getItem(ADMIN_STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AdminUser
    } catch {
      return null
    }
  }

  const setSession = (user: AdminUser): void => {
    if (!isBrowser()) return
    window.sessionStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(user))
  }

  const clearSession = (): void => {
    if (!isBrowser()) return
    window.sessionStorage.removeItem(ADMIN_STORAGE_KEY)
  }

  return {
    isAuthenticated(): boolean {
      const session = getSession()
      return session !== null
    },

    getCurrentUser(): AdminUser | null {
      return getSession()
    },

    login(username: string, password: string): { success: boolean; error?: string } {
      const credentials = getAdminCredentials()
      const cred = credentials[username]
      if (!cred) {
        return { success: false, error: '用户名不存在' }
      }
      if (cred.password !== password) {
        return { success: false, error: '密码错误' }
      }

      const user: AdminUser = {
        id: `admin-${Date.now()}`,
        username,
        role: cred.role,
        loginAt: new Date().toISOString()
      }
      setSession(user)
      return { success: true }
    },

    logout(): void {
      clearSession()
    },

    requireAuth(): void {
      if (!this.isAuthenticated()) {
        throw new Error('需要管理员权限')
      }
    }
  }
}

export const adminAuth = createAdminAuth()
