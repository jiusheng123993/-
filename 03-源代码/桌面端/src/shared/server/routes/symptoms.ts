import { Router, type Response, type NextFunction, type Request } from 'express'
import { requireAuth, canAccessUserResource } from '../auth/authMiddleware'
import type { AuthenticatedRequest } from '../auth/authTypes'
import { petProfileRepo, petSymptomCheckRepo } from '../db'
import type { DbPetSymptomCheck } from '../db'

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

function severityToUrgency(severity: string): string {
  switch (severity) {
    case 'severe': return 'red'
    case 'moderate': return 'yellow'
    default: return 'green'
  }
}

function toSymptomCheckResponse(check: DbPetSymptomCheck) {
  return {
    id: check.id,
    petId: check.pet_id,
    symptoms: check.symptoms,
    severity: check.severity,
    description: check.ai_advice,
    duration: check.duration || null,
    result: check.possible_conditions.length > 0 ? check.possible_conditions : null,
    createdAt: check.created_at
  }
}

export function createSymptomsRouter(): Router {
  const router = Router()

  router.post('/', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
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
      const pet = await petProfileRepo.findById(req.params.petId, req.auth!.userId!)
      if (!pet) {
        safeError(res, 404, 'Pet not found')
        return
      }
      if (!canAccessUserResource(req.auth, pet.user_id)) {
        safeError(res, 403, 'Forbidden')
        return
      }
      const severity = body.severity || 'mild'
      const check = await petSymptomCheckRepo.create({
        petId: req.params.petId,
        userId: req.auth!.userId!,
        symptoms: body.symptoms,
        duration: body.duration || 'unknown',
        severity,
        urgencyLevel: severityToUrgency(severity),
        possibleConditions: [],
        aiAdvice: body.description || undefined,
        disclaimerAccepted: false
      })
      res.status(201).json(toSymptomCheckResponse(check))
    } catch {
      safeError(res, 500, 'Failed to create symptom check')
    }
  }))

  router.get('/', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!validatePetId(req.params.petId)) {
      safeError(res, 400, 'Invalid petId format')
      return
    }
    try {
      const pet = await petProfileRepo.findById(req.params.petId, req.auth!.userId!)
      if (!pet) {
        safeError(res, 404, 'Pet not found')
        return
      }
      if (!canAccessUserResource(req.auth, pet.user_id)) {
        safeError(res, 403, 'Forbidden')
        return
      }
      const checks = await petSymptomCheckRepo.findByPetId(req.params.petId, req.auth!.userId!)
      res.json(checks.map(toSymptomCheckResponse))
    } catch {
      safeError(res, 500, 'Failed to fetch symptom checks')
    }
  }))

  return router
}
