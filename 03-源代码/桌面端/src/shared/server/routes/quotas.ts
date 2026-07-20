import { Router, type Response, type NextFunction, type Request } from 'express'
import { requireAuth, canAccessUserResource } from '../auth/authMiddleware'
import type { AuthenticatedRequest } from '../auth/authTypes'

const USER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/
const VALID_QUOTA_TYPES = ['food_query', 'symptom_check', 'emotion_session', 'ai_consultation'] as const

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

function validateQuotaType(quotaType: string): boolean {
  return VALID_QUOTA_TYPES.includes(quotaType as typeof VALID_QUOTA_TYPES[number])
}

interface UseQuotaBody {
  userId: string
  amount?: number
}

const USE_QUOTA_FIELDS_WHITELIST: ReadonlySet<string> = new Set([
  'userId', 'amount'
])

function validateUseQuotaBody(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Invalid request body'] }
  }
  const data = body as Record<string, unknown>
  for (const key of Object.keys(data)) {
    if (!USE_QUOTA_FIELDS_WHITELIST.has(key)) {
      errors.push(`Unknown field: ${key}`)
    }
  }
  if (!data.userId || !validateUserId(data.userId as string)) {
    errors.push('Invalid userId')
  }
  if (data.amount !== undefined) {
    const amount = typeof data.amount === 'number' ? data.amount : NaN
    if (isNaN(amount) || amount < 1 || amount > 100 || !Number.isInteger(amount)) {
      errors.push('amount must be a positive integer between 1 and 100')
    }
  }
  return { valid: errors.length === 0, errors }
}

export function createQuotasRouter(): Router {
  const router = Router()

  router.get('/', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    const userId = req.auth?.userId
    if (!userId || !validateUserId(userId)) {
      safeError(res, 400, 'Invalid userId')
      return
    }
    try {
      const quotas = {
        userId,
        quotas: VALID_QUOTA_TYPES.map(qt => ({
          type: qt,
          total: 0,
          used: 0,
          remaining: 0
        }))
      }
      res.json(quotas)
    } catch {
      safeError(res, 500, 'Failed to fetch quotas')
    }
  }))

  router.post('/:quotaType/use', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    if (!validateQuotaType(req.params.quotaType)) {
      safeError(res, 400, `quotaType must be one of: ${VALID_QUOTA_TYPES.join(', ')}`)
      return
    }
    const validation = validateUseQuotaBody(req.body)
    if (!validation.valid) {
      safeError(res, 400, validation.errors.join('; '))
      return
    }
    const body = req.body as UseQuotaBody
    if (!canAccessUserResource(req.auth, body.userId)) {
      safeError(res, 403, 'Forbidden')
      return
    }
    try {
      const result = {
        quotaType: req.params.quotaType,
        used: body.amount || 1,
        remaining: 0,
        success: true
      }
      res.json(result)
    } catch {
      safeError(res, 500, 'Failed to use quota')
    }
  }))

  return router
}
