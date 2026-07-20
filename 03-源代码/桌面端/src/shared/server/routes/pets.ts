import { Router, type Response, type NextFunction, type Request } from 'express'
import { requireAuth, canAccessUserResource } from '../auth/authMiddleware'
import type { AuthenticatedRequest } from '../auth/authTypes'

const PET_ID_PATTERN = /^pet-[a-zA-Z0-9_-]{6,64}$/
const USER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/
const VALID_PET_GENDERS = ['male', 'female', 'unknown'] as const
const VALID_PET_TYPES = ['dog', 'cat', 'bird', 'fish', 'hamster', 'rabbit', 'reptile', 'other'] as const
const NAME_MAX_LENGTH = 64
const BREED_MAX_LENGTH = 64
const AVATAR_URL_MAX_LENGTH = 512

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

function validateUserId(userId: string): boolean {
  return typeof userId === 'string' && USER_ID_PATTERN.test(userId)
}

interface CreatePetBody {
  userId: string
  name: string
  petType: string
  breed?: string
  gender?: string
  birthday?: string
  avatarUrl?: string
}

interface UpdatePetBody {
  name?: string
  petType?: string
  breed?: string
  gender?: string
  birthday?: string
  avatarUrl?: string
}

const PET_FIELDS_WHITELIST: ReadonlySet<string> = new Set([
  'userId', 'name', 'petType', 'breed', 'gender', 'birthday', 'avatarUrl'
])

const UPDATE_FIELDS_WHITELIST: ReadonlySet<string> = new Set([
  'name', 'petType', 'breed', 'gender', 'birthday', 'avatarUrl'
])

function validateCreatePetBody(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Invalid request body'] }
  }
  const data = body as Record<string, unknown>
  for (const key of Object.keys(data)) {
    if (!PET_FIELDS_WHITELIST.has(key)) {
      errors.push(`Unknown field: ${key}`)
    }
  }
  if (!data.userId || !validateUserId(data.userId as string)) {
    errors.push('Invalid userId')
  }
  if (!data.name || typeof data.name !== 'string' || data.name.length > NAME_MAX_LENGTH || data.name.trim().length === 0) {
    errors.push('Invalid name')
  }
  if (!data.petType || !VALID_PET_TYPES.includes(data.petType as typeof VALID_PET_TYPES[number])) {
    errors.push(`petType must be one of: ${VALID_PET_TYPES.join(', ')}`)
  }
  if (data.gender !== undefined && !VALID_PET_GENDERS.includes(data.gender as typeof VALID_PET_GENDERS[number])) {
    errors.push(`gender must be one of: ${VALID_PET_GENDERS.join(', ')}`)
  }
  if (data.breed !== undefined && (typeof data.breed !== 'string' || data.breed.length > BREED_MAX_LENGTH)) {
    errors.push('Invalid breed')
  }
  if (data.birthday !== undefined && typeof data.birthday === 'string') {
    const parsed = Date.parse(data.birthday)
    if (isNaN(parsed) || parsed > Date.now()) {
      errors.push('Invalid birthday')
    }
  }
  if (data.avatarUrl !== undefined && (typeof data.avatarUrl !== 'string' || data.avatarUrl.length > AVATAR_URL_MAX_LENGTH)) {
    errors.push('Invalid avatarUrl')
  }
  return { valid: errors.length === 0, errors }
}

function validateUpdatePetBody(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Invalid request body'] }
  }
  const data = body as Record<string, unknown>
  for (const key of Object.keys(data)) {
    if (!UPDATE_FIELDS_WHITELIST.has(key)) {
      errors.push(`Unknown field: ${key}`)
    }
  }
  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.length > NAME_MAX_LENGTH || (data.name as string).trim().length === 0)) {
    errors.push('Invalid name')
  }
  if (data.petType !== undefined && !VALID_PET_TYPES.includes(data.petType as typeof VALID_PET_TYPES[number])) {
    errors.push(`petType must be one of: ${VALID_PET_TYPES.join(', ')}`)
  }
  if (data.gender !== undefined && !VALID_PET_GENDERS.includes(data.gender as typeof VALID_PET_GENDERS[number])) {
    errors.push(`gender must be one of: ${VALID_PET_GENDERS.join(', ')}`)
  }
  if (data.breed !== undefined && (typeof data.breed !== 'string' || data.breed.length > BREED_MAX_LENGTH)) {
    errors.push('Invalid breed')
  }
  if (data.birthday !== undefined && typeof data.birthday === 'string') {
    const parsed = Date.parse(data.birthday)
    if (isNaN(parsed) || parsed > Date.now()) {
      errors.push('Invalid birthday')
    }
  }
  if (data.avatarUrl !== undefined && (typeof data.avatarUrl !== 'string' || data.avatarUrl.length > AVATAR_URL_MAX_LENGTH)) {
    errors.push('Invalid avatarUrl')
  }
  return { valid: errors.length === 0, errors }
}

export function createPetsRouter(): Router {
  const router = Router()

  router.post('/', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    const validation = validateCreatePetBody(req.body)
    if (!validation.valid) {
      safeError(res, 400, validation.errors.join('; '))
      return
    }
    const body = req.body as CreatePetBody
    if (!canAccessUserResource(req.auth, body.userId)) {
      safeError(res, 403, 'Forbidden')
      return
    }
    try {
      const pet = {
        id: `pet-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
        userId: body.userId,
        name: body.name,
        petType: body.petType,
        breed: body.breed || null,
        gender: body.gender || 'unknown',
        birthday: body.birthday || null,
        avatarUrl: body.avatarUrl || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      res.status(201).json(pet)
    } catch {
      safeError(res, 500, 'Failed to create pet')
    }
  }))

  router.get('/', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    const userId = req.auth?.userId
    if (!userId || !validateUserId(userId)) {
      safeError(res, 400, 'Invalid userId')
      return
    }
    try {
      const pets: unknown[] = []
      res.json(pets)
    } catch {
      safeError(res, 500, 'Failed to fetch pets')
    }
  }))

  router.get('/:petId', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
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
      res.json(pet)
    } catch {
      safeError(res, 500, 'Failed to fetch pet')
    }
  }))

  router.put('/:petId', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    if (!validatePetId(req.params.petId)) {
      safeError(res, 400, 'Invalid petId format')
      return
    }
    const validation = validateUpdatePetBody(req.body)
    if (!validation.valid) {
      safeError(res, 400, validation.errors.join('; '))
      return
    }
    try {
      const existingPet: { userId: string } | null = null
      if (!existingPet) {
        safeError(res, 404, 'Pet not found')
        return
      }
      if (!canAccessUserResource(req.auth, existingPet.userId)) {
        safeError(res, 403, 'Forbidden')
        return
      }
      const body = req.body as UpdatePetBody
      const updated = {
        ...existingPet,
        ...body,
        updatedAt: new Date().toISOString()
      }
      res.json(updated)
    } catch {
      safeError(res, 500, 'Failed to update pet')
    }
  }))

  router.delete('/:petId', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    if (!validatePetId(req.params.petId)) {
      safeError(res, 400, 'Invalid petId format')
      return
    }
    try {
      const existingPet: { userId: string } | null = null
      if (!existingPet) {
        safeError(res, 404, 'Pet not found')
        return
      }
      if (!canAccessUserResource(req.auth, existingPet.userId)) {
        safeError(res, 403, 'Forbidden')
        return
      }
      res.json({ deleted: true })
    } catch {
      safeError(res, 500, 'Failed to delete pet')
    }
  }))

  return router
}
