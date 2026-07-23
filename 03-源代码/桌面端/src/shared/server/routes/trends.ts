import { Router, type Response, type NextFunction, type Request } from 'express'
import { requireAuth, canAccessUserResource } from '../auth/authMiddleware'
import type { AuthenticatedRequest } from '../auth/authTypes'
import { petProfileRepo, petHealthEntryRepo, petHealthTrendRepo } from '../db'
import type { DbPetHealthEntry } from '../db'

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

  router.get('/', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
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
      const pet = await petProfileRepo.findById(req.params.petId, req.auth!.userId!)
      if (!pet) {
        safeError(res, 404, 'Pet not found')
        return
      }
      if (!canAccessUserResource(req.auth, pet.user_id)) {
        safeError(res, 403, 'Forbidden')
        return
      }
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysParam)
      const startDateStr = startDate.toISOString().split('T')[0]
      const checkins = await petHealthEntryRepo.findByPetId(req.params.petId, req.auth!.userId!, { limit: daysParam })
      const filteredCheckins = checkins.filter((c: DbPetHealthEntry) => c.entry_date >= startDateStr)
      const metricField = metric || 'weight'
      const data = filteredCheckins.map((c: DbPetHealthEntry) => {
        const point: Record<string, unknown> = { date: c.entry_date }
        switch (metricField) {
          case 'weight': point.value = c.weight; break
          case 'appetite': point.value = c.appetite; break
          case 'energy': point.value = c.energy; break
          case 'mood': point.value = c.mood; break
        }
        return point
      }).filter((p: Record<string, unknown>) => p.value !== null && p.value !== undefined)
      res.json({ petId: req.params.petId, metric: metricField, days: daysParam, data })
    } catch {
      safeError(res, 500, 'Failed to fetch trends')
    }
  }))

  router.get('/monthly-report', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
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
      const pet = await petProfileRepo.findById(req.params.petId, req.auth!.userId!)
      if (!pet) {
        safeError(res, 404, 'Pet not found')
        return
      }
      if (!canAccessUserResource(req.auth, pet.user_id)) {
        safeError(res, 403, 'Forbidden')
        return
      }
      const reportMonth = month || new Date().toISOString().slice(0, 7)
      const monthStart = `${reportMonth}-01`
      const nextMonth = new Date(reportMonth + '-01')
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const monthEnd = nextMonth.toISOString().split('T')[0]
      const checkins = await petHealthEntryRepo.findByPetId(req.params.petId, req.auth!.userId!, { limit: 31 })
      const monthCheckins = checkins.filter((c: DbPetHealthEntry) => c.entry_date >= monthStart && c.entry_date < monthEnd)
      const alerts: string[] = []
      monthCheckins.forEach((c: DbPetHealthEntry) => {
        if (c.mood === 'terrible' || c.mood === 'bad') alerts.push(`${c.entry_date}: mood is ${c.mood}`)
        if (c.appetite === 'none' || c.appetite === 'vomiting') alerts.push(`${c.entry_date}: appetite is ${c.appetite}`)
      })
      const summary = monthCheckins.length > 0 ? {
        totalCheckins: monthCheckins.length,
        averageMood: monthCheckins.filter((c: DbPetHealthEntry) => c.mood).map((c: DbPetHealthEntry) => c.mood).join(', ') || null,
        averageAppetite: monthCheckins.filter((c: DbPetHealthEntry) => c.appetite).map((c: DbPetHealthEntry) => c.appetite).join(', ') || null
      } : null
      res.json({ petId: req.params.petId, month: reportMonth, summary, checkinCount: monthCheckins.length, alerts })
    } catch {
      safeError(res, 500, 'Failed to fetch monthly report')
    }
  }))

  return router
}
