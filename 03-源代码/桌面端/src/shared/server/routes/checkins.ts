import { Router, type Response, type NextFunction, type Request } from 'express'
import { requireAuth, canAccessUserResource } from '../auth/authMiddleware'
import type { AuthenticatedRequest } from '../auth/authTypes'
import { petProfileRepo, petHealthEntryRepo } from '../db'
import type { DbPetHealthEntry } from '../db'

const PET_ID_PATTERN = /^pet-[a-zA-Z0-9_-]{6,64}$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MOOD_MAX_LENGTH = 32
const NOTE_MAX_LENGTH = 1024
const VALID_MOODS = ['great', 'good', 'normal', 'bad', 'terrible'] as const

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

function validateDate(date: string): boolean {
  if (!DATE_PATTERN.test(date)) return false
  const parsed = Date.parse(date)
  return !isNaN(parsed)
}

interface CreateCheckinBody {
  date: string
  mood?: string
  appetite?: string
  energy?: string
  note?: string
  items?: Record<string, unknown>
}

const CHECKIN_FIELDS_WHITELIST: ReadonlySet<string> = new Set([
  'date', 'mood', 'appetite', 'energy', 'note', 'items'
])

function validateCreateCheckinBody(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Invalid request body'] }
  }
  const data = body as Record<string, unknown>
  for (const key of Object.keys(data)) {
    if (!CHECKIN_FIELDS_WHITELIST.has(key)) {
      errors.push(`Unknown field: ${key}`)
    }
  }
  if (!data.date || typeof data.date !== 'string' || !validateDate(data.date)) {
    errors.push('Invalid date (format: YYYY-MM-DD)')
  }
  if (data.mood !== undefined && !VALID_MOODS.includes(data.mood as typeof VALID_MOODS[number])) {
    errors.push(`mood must be one of: ${VALID_MOODS.join(', ')}`)
  }
  if (data.appetite !== undefined && (typeof data.appetite !== 'string' || data.appetite.length > MOOD_MAX_LENGTH)) {
    errors.push('Invalid appetite')
  }
  if (data.energy !== undefined && (typeof data.energy !== 'string' || data.energy.length > MOOD_MAX_LENGTH)) {
    errors.push('Invalid energy')
  }
  if (data.note !== undefined && (typeof data.note !== 'string' || data.note.length > NOTE_MAX_LENGTH)) {
    errors.push('Invalid note')
  }
  if (data.items !== undefined && (typeof data.items !== 'object' || data.items === null)) {
    errors.push('Invalid items')
  }
  return { valid: errors.length === 0, errors }
}

function toCheckinResponse(entry: DbPetHealthEntry) {
  return {
    id: entry.id,
    petId: entry.pet_id,
    date: entry.entry_date,
    mood: entry.mood || null,
    appetite: entry.appetite || null,
    energy: entry.energy || null,
    note: entry.notes,
    items: entry.ai_feedback || {},
    createdAt: entry.created_at
  }
}

export function createCheckinsRouter(): Router {
  const router = Router()

  router.post('/', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!validatePetId(req.params.petId)) {
      safeError(res, 400, 'Invalid petId format')
      return
    }
    const validation = validateCreateCheckinBody(req.body)
    if (!validation.valid) {
      safeError(res, 400, validation.errors.join('; '))
      return
    }
    const body = req.body as CreateCheckinBody
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
      const entry = await petHealthEntryRepo.create({
        petId: req.params.petId,
        userId: req.auth!.userId!,
        entryDate: body.date,
        appetite: body.appetite || 'normal',
        energy: body.energy || 'normal',
        stool: 'normal',
        mood: body.mood || 'normal',
        notes: body.note || undefined,
        aiFeedback: body.items || undefined
      })
      res.status(201).json(toCheckinResponse(entry))
    } catch {
      safeError(res, 500, 'Failed to create checkin')
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
      const checkins = await petHealthEntryRepo.findByPetId(req.params.petId, req.auth!.userId!)
      res.json(checkins.map(toCheckinResponse))
    } catch {
      safeError(res, 500, 'Failed to fetch checkins')
    }
  }))

  router.get('/:date', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!validatePetId(req.params.petId)) {
      safeError(res, 400, 'Invalid petId format')
      return
    }
    if (!validateDate(req.params.date)) {
      safeError(res, 400, 'Invalid date format (YYYY-MM-DD)')
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
      const checkin = await petHealthEntryRepo.findByDate(req.params.petId, req.auth!.userId!, req.params.date)
      if (!checkin) {
        safeError(res, 404, 'Checkin not found')
        return
      }
      res.json(toCheckinResponse(checkin))
    } catch {
      safeError(res, 500, 'Failed to fetch checkin')
    }
  }))

  return router
}
