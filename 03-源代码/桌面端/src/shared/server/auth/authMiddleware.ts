import type { Response, NextFunction } from 'express'
import type { AuthContext, AuthenticatedRequest } from './authTypes'
import { verifyToken } from './jwtService'

const DEV_TOKEN_PATTERN = /^dev-(user|admin):([a-zA-Z0-9_-]{1,64})$/

function isDevTokenAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' && (process.env.ENABLE_DEV_TOKEN === 'true' || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')
}

export function parseBearerToken(header: string | undefined): AuthContext | undefined {
  if (!header || typeof header !== 'string') return undefined
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return undefined

  const devMatch = DEV_TOKEN_PATTERN.exec(token)
  if (devMatch) {
    if (!isDevTokenAllowed()) return undefined
    return {
      role: devMatch[1] === 'admin' ? 'admin' : 'user',
      userId: devMatch[2]
    }
  }

  const payload = verifyToken(token)
  if (!payload) return undefined

  return {
    role: (payload.role as AuthContext['role']) || 'user',
    userId: payload.userId
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
