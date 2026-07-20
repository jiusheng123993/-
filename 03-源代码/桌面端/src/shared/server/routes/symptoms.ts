import { Router, type Response, type NextFunction, type Request } from 'express'
import { requireAuth, canAccessUserResource } from '../auth/authMiddleware'
import type { AuthenticatedRequest } from '../auth/authTypes'

const PET_ID_PATTERN = /^pet-[a-zA-Z0-9_-]{6,64}$/
const SYMPTOM_MAX_LENGTH = 256
const DESCRIPTION_MAX_LENGTH = 2048
const VALID_SEVERITY_LEVELS = ['mild', 'moderate', 'severe'] as const

function safeError(res: Response, code: number, message: string): void {
  res.status(code).json({ error: message })
}

function asyncHandler(fn: (req: Request, res: Response) => void | Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next)
  }
}

function validatePetId(petId: string): boolean {
  return typeof petId === 'string' && PET_ID_PATTERN.test(petId)
}

interface CreateSymptomCheckBody {
  symptoms: string[]
  severity?: string
  description?: string
  duration?: string
}

const SYMPTOM_CHECK_FIELDS_WHITELIST: ReadonlySet<string> = new Set([
  'symptoms', 'severity', 'description', 'duration'
])

function validateCreateSymptomCheckBody(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Invalid request body'] }
  }
  const data = body as Record<string, unknown>
  for (const key of Object.keys(data)) {
    if (!SYMPTOM_CHECK_FIELDS_WHITELIST.has(key)) {
      errors.push(`Unknown field: ${key}`)
    }
  }
  if (!Array.isArray(data.symptoms) || data.symptoms.length === 0 || data.symptoms.length > 20) {
    errors.push('symptoms must be a non-empty array with at most 20 items')
  } else {
    for (let i = 0; i < data.symptoms.length; i++) {
      const s = data.symptoms[i]
      if (typeof s !== 'string' || s.length === 0 || s.length > SYMPTOM_MAX_LENGTH) {
        errors.push(`Invalid symptom at index ${i}`)
        break
      }
    }
  }
  if (data.severity !== undefined && !VALID_SEVERITY_LEVELS.includes(data.severity as typeof VALID_SEVERITY_LEVELS[number])) {
    errors.push(`severity must be one of: ${VALID_SEVERITY_LEVELS.join(', ')}`)
  }
  if (data.description !== undefined && (typeof data.description !== 'string' || data.description.length > DESCRIPTION_MAX_LENGTH)) {
    errors.push('Invalid description')
  }
  if (data.duration !== undefined && (typeof data.duration !== 'string' || data.duration.length > 64)) {
    errors.push('Invalid duration')
  }
  return { valid: errors.length === 0, errors }
}

export function createSymptomsRouter(): Router {
  const router = Router()

  router.post('/', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    if (!validatePetId(req.params.petId)) {
      safeError(res, 400, 'Invalid petId format')
      return
    }
    const validation = validateCreateSymptomCheckBody(req.body)
    if (!validation.valid) {
      safeError(res, 400, validation.errors.join('; '))
      return
    }
    const body = req.body as CreateSymptomCheckBody
    try {
      const pet: { userId: string } | null = null
      if (!pet) {
        safeError(res, 404, 'Pet not found')
        return
      }
      if (!canAccessUserResource(req.auth, pet.userId)) {
        safeError(res, 403, 'Forbidden')
        return
      }
      const check = {
        id: `symptom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
        petId: req.params.petId,
        symptoms: body.symptoms,
        severity: body.severity || 'mild',
        description: body.description || null,
        duration: body.duration || null,
        result: null,
        createdAt: new Date().toISOString()
      }
      res.status(201).json(check)
    } catch {
      safeError(res, 500, 'Failed to create symptom check')
    }
  }))

  router.get('/', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    if (!validatePetId(req.params.petId)) {
      safeError(res, 400, 'Invalid petId format')
      return
    }
    try {
      const pet: { userId: string } | null = null
      if (!pet) {
        safeError(res, 404, 'Pet not found')
        return
      }
      if (!canAccessUserResource(req.auth, pet.userId)) {
        safeError(res, 403, 'Forbidden')
        return
      }
      const checks: unknown[] = []
      res.json(checks)
    } catch {
      safeError(res, 500, 'Failed to fetch symptom checks')
    }
  }))

  return router
}
