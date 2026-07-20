import { Router, type Response, type NextFunction, type Request } from 'express'
import { requireAuth, canAccessUserResource } from '../auth/authMiddleware'
import type { AuthenticatedRequest } from '../auth/authTypes'

const USER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/
const SESSION_ID_PATTERN = /^grief-[a-zA-Z0-9_-]{6,64}$/
const VALID_TRIGGER_TYPES = ['loss', 'anniversary', 'hospital_visit', 'behavior_change', 'other'] as const
const MESSAGE_MAX_LENGTH = 4096
const TRIGGER_DESCRIPTION_MAX_LENGTH = 2048

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

function validateSessionId(sessionId: string): boolean {
  return typeof sessionId === 'string' && SESSION_ID_PATTERN.test(sessionId)
}

interface TriggerEmotionBody {
  userId: string
  triggerType: string
  description?: string
  petId?: string
}

interface CreateGriefSessionBody {
  userId: string
  petId?: string
  context?: string
}

interface SendMessageBody {
  userId: string
  content: string
}

const TRIGGER_FIELDS_WHITELIST: ReadonlySet<string> = new Set([
  'userId', 'triggerType', 'description', 'petId'
])

const GRIEF_SESSION_FIELDS_WHITELIST: ReadonlySet<string> = new Set([
  'userId', 'petId', 'context'
])

const MESSAGE_FIELDS_WHITELIST: ReadonlySet<string> = new Set([
  'userId', 'content'
])

function validateTriggerEmotionBody(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Invalid request body'] }
  }
  const data = body as Record<string, unknown>
  for (const key of Object.keys(data)) {
    if (!TRIGGER_FIELDS_WHITELIST.has(key)) {
      errors.push(`Unknown field: ${key}`)
    }
  }
  if (!data.userId || !validateUserId(data.userId as string)) {
    errors.push('Invalid userId')
  }
  if (!data.triggerType || !VALID_TRIGGER_TYPES.includes(data.triggerType as typeof VALID_TRIGGER_TYPES[number])) {
    errors.push(`triggerType must be one of: ${VALID_TRIGGER_TYPES.join(', ')}`)
  }
  if (data.description !== undefined && (typeof data.description !== 'string' || data.description.length > TRIGGER_DESCRIPTION_MAX_LENGTH)) {
    errors.push('Invalid description')
  }
  if (data.petId !== undefined && (typeof data.petId !== 'string' || data.petId.length > 64)) {
    errors.push('Invalid petId')
  }
  return { valid: errors.length === 0, errors }
}

function validateCreateGriefSessionBody(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Invalid request body'] }
  }
  const data = body as Record<string, unknown>
  for (const key of Object.keys(data)) {
    if (!GRIEF_SESSION_FIELDS_WHITELIST.has(key)) {
      errors.push(`Unknown field: ${key}`)
    }
  }
  if (!data.userId || !validateUserId(data.userId as string)) {
    errors.push('Invalid userId')
  }
  if (data.petId !== undefined && (typeof data.petId !== 'string' || data.petId.length > 64)) {
    errors.push('Invalid petId')
  }
  if (data.context !== undefined && (typeof data.context !== 'string' || data.context.length > TRIGGER_DESCRIPTION_MAX_LENGTH)) {
    errors.push('Invalid context')
  }
  return { valid: errors.length === 0, errors }
}

function validateSendMessageBody(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Invalid request body'] }
  }
  const data = body as Record<string, unknown>
  for (const key of Object.keys(data)) {
    if (!MESSAGE_FIELDS_WHITELIST.has(key)) {
      errors.push(`Unknown field: ${key}`)
    }
  }
  if (!data.userId || !validateUserId(data.userId as string)) {
    errors.push('Invalid userId')
  }
  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0 || data.content.length > MESSAGE_MAX_LENGTH) {
    errors.push('Invalid content')
  }
  return { valid: errors.length === 0, errors }
}

export function createEmotionsRouter(): Router {
  const router = Router()

  router.post('/trigger', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    const validation = validateTriggerEmotionBody(req.body)
    if (!validation.valid) {
      safeError(res, 400, validation.errors.join('; '))
      return
    }
    const body = req.body as TriggerEmotionBody
    if (!canAccessUserResource(req.auth, body.userId)) {
      safeError(res, 403, 'Forbidden')
      return
    }
    try {
      const trigger = {
        id: `trigger-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
        userId: body.userId,
        triggerType: body.triggerType,
        description: body.description || null,
        petId: body.petId || null,
        createdAt: new Date().toISOString()
      }
      res.status(201).json(trigger)
    } catch {
      safeError(res, 500, 'Failed to trigger emotion')
    }
  }))

  router.get('/triggers', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    const userId = req.auth?.userId
    if (!userId || !validateUserId(userId)) {
      safeError(res, 400, 'Invalid userId')
      return
    }
    try {
      const triggers: unknown[] = []
      res.json(triggers)
    } catch {
      safeError(res, 500, 'Failed to fetch triggers')
    }
  }))

  router.post('/grief-session', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    const validation = validateCreateGriefSessionBody(req.body)
    if (!validation.valid) {
      safeError(res, 400, validation.errors.join('; '))
      return
    }
    const body = req.body as CreateGriefSessionBody
    if (!canAccessUserResource(req.auth, body.userId)) {
      safeError(res, 403, 'Forbidden')
      return
    }
    try {
      const session = {
        id: `grief-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
        userId: body.userId,
        petId: body.petId || null,
        context: body.context || null,
        status: 'active',
        messages: [],
        createdAt: new Date().toISOString()
      }
      res.status(201).json(session)
    } catch {
      safeError(res, 500, 'Failed to create grief session')
    }
  }))

  router.post('/grief-session/:sessionId/message', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    if (!validateSessionId(req.params.sessionId)) {
      safeError(res, 400, 'Invalid sessionId format')
      return
    }
    const validation = validateSendMessageBody(req.body)
    if (!validation.valid) {
      safeError(res, 400, validation.errors.join('; '))
      return
    }
    const body = req.body as SendMessageBody
    if (!canAccessUserResource(req.auth, body.userId)) {
      safeError(res, 403, 'Forbidden')
      return
    }
    try {
      const session: { userId: string; id: string } | null = null
      if (!session) {
        safeError(res, 404, 'Session not found')
        return
      }
      if (!canAccessUserResource(req.auth, session.userId)) {
        safeError(res, 403, 'Forbidden')
        return
      }
      if (session.id !== req.params.sessionId) {
        safeError(res, 403, 'Forbidden')
        return
      }
      const message = {
        id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
        sessionId: req.params.sessionId,
        role: 'user',
        content: body.content,
        createdAt: new Date().toISOString()
      }
      res.status(201).json(message)
    } catch {
      safeError(res, 500, 'Failed to send message')
    }
  }))

  return router
}
