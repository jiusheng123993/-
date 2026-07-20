import { Router, type Response, type NextFunction, type Request } from 'express'
import { requireAuth, canAccessUserResource } from '../auth/authMiddleware'
import type { AuthenticatedRequest } from '../auth/authTypes'

const USER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/
const VALID_PLANS = ['monthly', 'quarterly', 'yearly'] as const
const VALID_CHANNELS = ['wechat', 'alipay', 'apple'] as const

function safeError(res: Response, code: number, message: string): void {
  res.status(code).json({ error: message })
}

function asyncHandler(fn: (req: Request, res: Response) => void | Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next)
  }
}

function validateUserId(userId: string): boolean {
  return typeof userId === 'string' && USER_ID_PATTERN.test(userId)
}

interface SubscribeBody {
  userId: string
  plan: string
  channel: string
}

const SUBSCRIBE_FIELDS_WHITELIST: ReadonlySet<string> = new Set([
  'userId', 'plan', 'channel'
])

function validateSubscribeBody(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Invalid request body'] }
  }
  const data = body as Record<string, unknown>
  for (const key of Object.keys(data)) {
    if (!SUBSCRIBE_FIELDS_WHITELIST.has(key)) {
      errors.push(`Unknown field: ${key}`)
    }
  }
  if (!data.userId || !validateUserId(data.userId as string)) {
    errors.push('Invalid userId')
  }
  if (!data.plan || !VALID_PLANS.includes(data.plan as typeof VALID_PLANS[number])) {
    errors.push(`plan must be one of: ${VALID_PLANS.join(', ')}`)
  }
  if (!data.channel || !VALID_CHANNELS.includes(data.channel as typeof VALID_CHANNELS[number])) {
    errors.push(`channel must be one of: ${VALID_CHANNELS.join(', ')}`)
  }
  return { valid: errors.length === 0, errors }
}

export function createMembershipRouter(): Router {
  const router = Router()

  router.get('/', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    const userId = req.auth?.userId
    if (!userId || !validateUserId(userId)) {
      safeError(res, 400, 'Invalid userId')
      return
    }
    try {
      const membership = {
        userId,
        plan: null,
        status: 'free',
        expireAt: null,
        createdAt: new Date().toISOString()
      }
      res.json(membership)
    } catch {
      safeError(res, 500, 'Failed to fetch membership')
    }
  }))

  router.post('/subscribe', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    const validation = validateSubscribeBody(req.body)
    if (!validation.valid) {
      safeError(res, 400, validation.errors.join('; '))
      return
    }
    const body = req.body as SubscribeBody
    if (!canAccessUserResource(req.auth, body.userId)) {
      safeError(res, 403, 'Forbidden')
      return
    }
    try {
      const subscription = {
        id: `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
        userId: body.userId,
        plan: body.plan,
        channel: body.channel,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
      res.status(201).json(subscription)
    } catch {
      safeError(res, 500, 'Failed to subscribe')
    }
  }))

  return router
}
