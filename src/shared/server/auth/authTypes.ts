import type { Request } from 'express'

export type AuthRole = 'user' | 'admin'

export interface AuthContext {
  userId: string
  role: AuthRole
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthContext
}
