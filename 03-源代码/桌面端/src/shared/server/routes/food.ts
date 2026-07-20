import { Router, type Response, type NextFunction, type Request } from 'express'
import { requireAuth, canAccessUserResource } from '../auth/authMiddleware'
import type { AuthenticatedRequest } from '../auth/authTypes'

const USER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/
const FOOD_NAME_MAX_LENGTH = 128
const QUERY_MAX_LENGTH = 512
const VALID_SAFETY_LEVELS = ['safe', 'caution', 'danger', 'unknown'] as const

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

interface CreateFoodQueryBody {
  userId: string
  foodName: string
  petType?: string
}

const FOOD_QUERY_FIELDS_WHITELIST: ReadonlySet<string> = new Set([
  'userId', 'foodName', 'petType'
])

function validateCreateFoodQueryBody(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Invalid request body'] }
  }
  const data = body as Record<string, unknown>
  for (const key of Object.keys(data)) {
    if (!FOOD_QUERY_FIELDS_WHITELIST.has(key)) {
      errors.push(`Unknown field: ${key}`)
    }
  }
  if (!data.userId || !validateUserId(data.userId as string)) {
    errors.push('Invalid userId')
  }
  if (!data.foodName || typeof data.foodName !== 'string' || data.foodName.length === 0 || data.foodName.length > FOOD_NAME_MAX_LENGTH) {
    errors.push('Invalid foodName')
  }
  if (data.petType !== undefined && (typeof data.petType !== 'string' || data.petType.length > 32)) {
    errors.push('Invalid petType')
  }
  return { valid: errors.length === 0, errors }
}

export function createFoodRouter(): Router {
  const router = Router()

  router.post('/', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    const validation = validateCreateFoodQueryBody(req.body)
    if (!validation.valid) {
      safeError(res, 400, validation.errors.join('; '))
      return
    }
    const body = req.body as CreateFoodQueryBody
    if (!canAccessUserResource(req.auth, body.userId)) {
      safeError(res, 403, 'Forbidden')
      return
    }
    try {
      const query = {
        id: `food-q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
        userId: body.userId,
        foodName: body.foodName,
        petType: body.petType || null,
        safetyLevel: 'unknown' as const,
        createdAt: new Date().toISOString()
      }
      res.status(201).json(query)
    } catch {
      safeError(res, 500, 'Failed to create food query')
    }
  }))

  router.get('/', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    const userId = req.auth?.userId
    if (!userId || !validateUserId(userId)) {
      safeError(res, 400, 'Invalid userId')
      return
    }
    try {
      const queries: unknown[] = []
      res.json(queries)
    } catch {
      safeError(res, 500, 'Failed to fetch food queries')
    }
  }))

  return router
}
