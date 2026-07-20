import { Router, type Response, type NextFunction, type Request } from 'express'
import { requireAuth, canAccessUserResource } from '../auth/authMiddleware'
import type { AuthenticatedRequest } from '../auth/authTypes'
import { petProfileRepo, petVaccinationRepo } from '../db'
import type { DbPetVaccination } from '../db'

const PET_ID_PATTERN = /^pet-[a-zA-Z0-9_-]{6,64}$/
const VACCINE_ID_PATTERN = /^vaccine-[a-zA-Z0-9_-]{6,64}$/
const NAME_MAX_LENGTH = 128
const NOTE_MAX_LENGTH = 1024
const VALID_VACCINE_TYPES = ['vaccine', 'deworming'] as const
const VALID_VACCINE_STATUSES = ['pending', 'completed', 'overdue'] as const

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

function validateVaccineId(vaccineId: string): boolean {
  return typeof vaccineId === 'string' && VACCINE_ID_PATTERN.test(vaccineId)
}

function validateDateString(value: string): boolean {
  const parsed = Date.parse(value)
  return !isNaN(parsed)
}

interface CreateVaccineBody {
  name: string
  vaccineType: string
  scheduledDate: string
  completedDate?: string
  note?: string
}

interface UpdateVaccineBody {
  status?: string
  completedDate?: string
  note?: string
}

const VACCINE_FIELDS_WHITELIST: ReadonlySet<string> = new Set([
  'name', 'vaccineType', 'scheduledDate', 'completedDate', 'note'
])

const UPDATE_VACCINE_FIELDS_WHITELIST: ReadonlySet<string> = new Set([
  'status', 'completedDate', 'note'
])

function validateCreateVaccineBody(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Invalid request body'] }
  }
  const data = body as Record<string, unknown>
  for (const key of Object.keys(data)) {
    if (!VACCINE_FIELDS_WHITELIST.has(key)) {
      errors.push(`Unknown field: ${key}`)
    }
  }
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0 || data.name.length > NAME_MAX_LENGTH) {
    errors.push('Invalid name')
  }
  if (!data.vaccineType || !VALID_VACCINE_TYPES.includes(data.vaccineType as typeof VALID_VACCINE_TYPES[number])) {
    errors.push(`vaccineType must be one of: ${VALID_VACCINE_TYPES.join(', ')}`)
  }
  if (!data.scheduledDate || typeof data.scheduledDate !== 'string' || !validateDateString(data.scheduledDate)) {
    errors.push('Invalid scheduledDate')
  }
  if (data.completedDate !== undefined && (typeof data.completedDate !== 'string' || !validateDateString(data.completedDate))) {
    errors.push('Invalid completedDate')
  }
  if (data.note !== undefined && (typeof data.note !== 'string' || data.note.length > NOTE_MAX_LENGTH)) {
    errors.push('Invalid note')
  }
  return { valid: errors.length === 0, errors }
}

function validateUpdateVaccineBody(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Invalid request body'] }
  }
  const data = body as Record<string, unknown>
  for (const key of Object.keys(data)) {
    if (!UPDATE_VACCINE_FIELDS_WHITELIST.has(key)) {
      errors.push(`Unknown field: ${key}`)
    }
  }
  if (data.status !== undefined && !VALID_VACCINE_STATUSES.includes(data.status as typeof VALID_VACCINE_STATUSES[number])) {
    errors.push(`status must be one of: ${VALID_VACCINE_STATUSES.join(', ')}`)
  }
  if (data.completedDate !== undefined && (typeof data.completedDate !== 'string' || !validateDateString(data.completedDate))) {
    errors.push('Invalid completedDate')
  }
  if (data.note !== undefined && (typeof data.note !== 'string' || data.note.length > NOTE_MAX_LENGTH)) {
    errors.push('Invalid note')
  }
  return { valid: errors.length === 0, errors }
}

function toVaccineResponse(vaccination: DbPetVaccination) {
  let status: string = 'pending'
  if (vaccination.completed_date) {
    status = 'completed'
  } else if (vaccination.is_overdue) {
    status = 'overdue'
  }
  return {
    id: vaccination.id,
    petId: vaccination.pet_id,
    name: vaccination.vaccine_name,
    vaccineType: vaccination.vaccine_type,
    scheduledDate: vaccination.scheduled_date,
    completedDate: vaccination.completed_date,
    status,
    note: vaccination.notes,
    isOverdue: vaccination.is_overdue,
    createdAt: vaccination.created_at,
    updatedAt: vaccination.updated_at
  }
}

export function createVaccinesRouter(): Router {
  const router = Router()

  router.post('/', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!validatePetId(req.params.petId)) {
      safeError(res, 400, 'Invalid petId format')
      return
    }
    const validation = validateCreateVaccineBody(req.body)
    if (!validation.valid) {
      safeError(res, 400, validation.errors.join('; '))
      return
    }
    const body = req.body as CreateVaccineBody
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
      const vaccination = await petVaccinationRepo.create({
        petId: req.params.petId,
        userId: req.auth!.userId!,
        vaccineName: body.name,
        vaccineType: body.vaccineType,
        scheduledDate: body.scheduledDate,
        completedDate: body.completedDate,
        notes: body.note || undefined
      })
      res.status(201).json(toVaccineResponse(vaccination))
    } catch {
      safeError(res, 500, 'Failed to create vaccine record')
    }
  }))

  router.get('/upcoming', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
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
      const allVaccines = await petVaccinationRepo.findByPetId(req.params.petId, req.auth!.userId!)
      const upcoming = allVaccines.filter(v => !v.completed_date)
      res.json(upcoming.map(toVaccineResponse))
    } catch {
      safeError(res, 500, 'Failed to fetch upcoming vaccines')
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
      const vaccines = await petVaccinationRepo.findByPetId(req.params.petId, req.auth!.userId!)
      res.json(vaccines.map(toVaccineResponse))
    } catch {
      safeError(res, 500, 'Failed to fetch vaccines')
    }
  }))

  router.put('/:vaccineId', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!validatePetId(req.params.petId)) {
      safeError(res, 400, 'Invalid petId format')
      return
    }
    if (!validateVaccineId(req.params.vaccineId)) {
      safeError(res, 400, 'Invalid vaccineId format')
      return
    }
    const validation = validateUpdateVaccineBody(req.body)
    if (!validation.valid) {
      safeError(res, 400, validation.errors.join('; '))
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
      const existingVaccine = await petVaccinationRepo.findById(req.params.vaccineId, req.auth!.userId!)
      if (!existingVaccine) {
        safeError(res, 404, 'Vaccine not found')
        return
      }
      if (existingVaccine.pet_id !== req.params.petId) {
        safeError(res, 403, 'Forbidden')
        return
      }
      const body = req.body as UpdateVaccineBody
      const updates: Record<string, unknown> = {}
      if (body.status === 'completed' && !body.completedDate) {
        updates.completed_date = new Date().toISOString().split('T')[0]
      } else if (body.completedDate !== undefined) {
        updates.completed_date = body.completedDate
      }
      if (body.note !== undefined) updates.notes = body.note
      const updated = await petVaccinationRepo.update(req.params.vaccineId, req.auth!.userId!, updates as any)
      if (!updated) {
        safeError(res, 500, 'Failed to update vaccine')
        return
      }
      res.json(toVaccineResponse(updated))
    } catch {
      safeError(res, 500, 'Failed to update vaccine')
    }
  }))

  return router
}
