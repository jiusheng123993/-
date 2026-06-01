import { describe, it, expect, vi } from 'vitest'
import { parseBearerToken, requireAuth, isAdmin, canAccessUserResource } from './authMiddleware'
import type { AuthenticatedRequest } from './authTypes'

function createReq(authorization?: string): AuthenticatedRequest {
  return {
    headers: authorization ? { authorization } : {}
  } as AuthenticatedRequest
}

function createRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(body: unknown) {
      this.body = body
      return this
    }
  }
  return res
}

describe('authMiddleware', () => {
  describe('parseBearerToken', () => {
    it('parses user dev token', () => {
      expect(parseBearerToken('Bearer dev-user:user-123')).toEqual({
        userId: 'user-123',
        role: 'user'
      })
    })

    it('parses admin dev token', () => {
      expect(parseBearerToken('Bearer dev-admin:admin-001')).toEqual({
        userId: 'admin-001',
        role: 'admin'
      })
    })

    it('returns undefined for missing header', () => {
      expect(parseBearerToken(undefined)).toBeUndefined()
    })

    it('returns undefined for malformed bearer format', () => {
      expect(parseBearerToken('Basic dev-user:user-123')).toBeUndefined()
    })

    it('returns undefined for unsafe user id', () => {
      expect(parseBearerToken('Bearer dev-user:../evil')).toBeUndefined()
    })

    it('returns undefined for unsupported token', () => {
      expect(parseBearerToken('Bearer jwt-token')).toBeUndefined()
    })
  })

  describe('requireAuth', () => {
    it('injects auth and calls next for valid token', () => {
      const req = createReq('Bearer dev-user:user-123')
      const res = createRes()
      const next = vi.fn()

      requireAuth(req, res as never, next)

      expect(req.auth).toEqual({ userId: 'user-123', role: 'user' })
      expect(next).toHaveBeenCalledTimes(1)
    })

    it('returns 401 for missing token', () => {
      const req = createReq()
      const res = createRes()
      const next = vi.fn()

      requireAuth(req, res as never, next)

      expect(res.statusCode).toBe(401)
      expect(res.body).toEqual({ error: 'Unauthorized' })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('authorization helpers', () => {
    it('detects admin role', () => {
      expect(isAdmin({ userId: 'admin-001', role: 'admin' })).toBe(true)
      expect(isAdmin({ userId: 'user-123', role: 'user' })).toBe(false)
    })

    it('allows same user resource access', () => {
      expect(canAccessUserResource({ userId: 'user-123', role: 'user' }, 'user-123')).toBe(true)
    })

    it('denies other user resource access', () => {
      expect(canAccessUserResource({ userId: 'user-123', role: 'user' }, 'user-456')).toBe(false)
    })

    it('allows admin resource access', () => {
      expect(canAccessUserResource({ userId: 'admin-001', role: 'admin' }, 'user-456')).toBe(true)
    })
  })
})
