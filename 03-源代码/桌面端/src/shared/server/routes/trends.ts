import { Router, type Response, type NextFunction, type Request } from 'express'
import { requireAuth, canAccessUserResource } from '../auth/authMiddleware'
import type { AuthenticatedRequest } from '../auth/authTypes'

const PET_ID_PATTERN = /^pet-[a-zA-Z0-9_-]{6,64}$/
const MONTH_PATTERN = /^\d{4}-\d{2}$/
const VALID_METRICS = ['weight', 'appetite', 'energy', 'mood'] as const

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

function validateMonth(month: string): boolean {
  if (!MONTH_PATTERN.test(month)) return false
  const [yearStr, monthStr] = month.split('-')
  const year = parseInt(yearStr, 10)
  const m = parseInt(monthStr, 10)
  return year >= 2000 && year <= 2100 && m >= 1 && m <= 12
}

export function createTrendsRouter(): Router {
  const router = Router()

  router.get('/', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    if (!validatePetId(req.params.petId)) {
      safeError(res, 400, 'Invalid petId format')
      return
    }
    const metric = typeof req.query.metric === 'string' ? req.query.metric : undefined
    if (metric && !VALID_METRICS.includes(metric as typeof VALID_METRICS[number])) {
      safeError(res, 400, `metric must be one of: ${VALID_METRICS.join(', ')}`)
      return
    }
    const daysParam = typeof req.query.days === 'string' ? parseInt(req.query.days, 10) : 30
    if (isNaN(daysParam) || daysParam < 1 || daysParam > 365) {
      safeError(res, 400, 'days must be between 1 and 365')
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
      const trends = {
        petId: req.params.petId,
        metric: metric || 'weight',
        days: daysParam,
        data: []
      }
      res.json(trends)
    } catch {
      safeError(res, 500, 'Failed to fetch trends')
    }
  }))

  router.get('/monthly-report', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    if (!validatePetId(req.params.petId)) {
      safeError(res, 400, 'Invalid petId format')
      return
    }
    const month = typeof req.query.month === 'string' ? req.query.month : undefined
    if (month && !validateMonth(month)) {
      safeError(res, 400, 'Invalid month format (YYYY-MM)')
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
      const report = {
        petId: req.params.petId,
        month: month || new Date().toISOString().slice(0, 7),
        summary: null,
        checkinCount: 0,
        alerts: []
      }
      res.json(report)
    } catch {
      safeError(res, 500, 'Failed to fetch monthly report')
    }
  }))

  return router
}
