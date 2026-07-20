import { Router, type Response, type NextFunction, type Request } from 'express'
import { requireAuth, canAccessUserResource } from '../auth/authMiddleware'
import type { AuthenticatedRequest } from '../auth/authTypes'
import { petFoodQueryRepo } from '../db'
import type { DbPetFoodQuery } from '../db'

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

function toFoodQueryResponse(query: DbPetFoodQuery) {
  return {
    id: query.id,
    userId: query.user_id,
    foodName: query.food_name,
    petType: query.species,
    safetyLevel: query.safety_level,
    description: query.description,
    createdAt: query.created_at
  }
}

export function createFoodRouter(): Router {
  const router = Router()

  router.post('/', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
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
      const query = await petFoodQueryRepo.create({
        userId: body.userId,
        foodName: body.foodName,
        species: body.petType || 'unknown',
        safetyLevel: 'unknown'
      })
      res.status(201).json(toFoodQueryResponse(query))
    } catch {
      safeError(res, 500, 'Failed to create food query')
    }
  }))

  router.get('/', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.auth?.userId
    if (!userId || !validateUserId(userId)) {
      safeError(res, 400, 'Invalid userId')
      return
    }
    try {
      const queries = await petFoodQueryRepo.findByUserId(userId)
      res.json(queries.map(toFoodQueryResponse))
    } catch {
      safeError(res, 500, 'Failed to fetch food queries')
    }
  }))

  return router
}
