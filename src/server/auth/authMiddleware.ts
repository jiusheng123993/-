import type { Response, NextFunction } from 'express'
import type { AuthContext, AuthenticatedRequest } from './authTypes'

const TOKEN_PATTERN = /^dev-(user|admin):([a-zA-Z0-9_-]{1,64})$/

export function parseBearerToken(header: string | undefined): AuthContext | undefined {
  if (!header || typeof header !== 'string') return undefined
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return undefined

  const match = TOKEN_PATTERN.exec(token)
  if (!match) return undefined

  return {
    role: match[1] === 'admin' ? 'admin' : 'user',
    userId: match[2]
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authorization = req.headers.authorization
  const auth = parseBearerToken(Array.isArray(authorization) ? authorization[0] : authorization)

  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  req.auth = auth
  next()
}

export function isAdmin(auth: AuthContext | undefined): boolean {
  return auth?.role === 'admin'
}

export function canAccessUserResource(auth: AuthContext | undefined, targetUserId: string): boolean {
  if (!auth) return false
  return auth.role === 'admin' || auth.userId === targetUserId
}
